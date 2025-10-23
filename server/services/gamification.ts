import { db } from "../db";
import {
  users,
  userLevels,
  levels,
  userCoins,
  streaks,
  badges,
  userBadges,
  studySessions,
  tasks,
  userStats,
  type User,
  type UserLevel,
  type Level,
  type UserCoins as UserCoinsType,
  type Streak,
  type Badge,
  type UserBadge,
} from "@shared/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import WebSocket from "ws"; // Assuming wss is a WebSocket server instance

// Mock WebSocket server for demonstration purposes
const wss = new WebSocket.Server({ noServer: true });

// XP and Level Constants
const XP_PER_STUDY_MINUTE = 2; // 2 XP per minute of study
const XP_PER_TASK_COMPLETED = 10; // Base XP for task completion
const EARLY_COMPLETION_BONUS_MULTIPLIER = 1.5; // 50% bonus for early completion
const COINS_PER_LEVEL = 100; // Coins awarded per level up
const STREAK_MILESTONE_COINS = [50, 100, 200, 500]; // Coins for 7, 14, 30, 100 day streaks

/**
 * Calculate XP earned from a study session
 */
export function calculateStudySessionXP(durationMinutes: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.floor(durationMinutes * XP_PER_STUDY_MINUTE);
}

/**
 * Calculate XP earned from task completion
 */
export function calculateTaskCompletionXP(
  baseXP: number,
  isEarlyCompletion: boolean,
  priority: string
): number {
  let xp = baseXP || XP_PER_TASK_COMPLETED;

  // Apply priority multiplier
  const priorityMultipliers = { low: 1, medium: 1.2, high: 1.5 };
  xp *= priorityMultipliers[priority as keyof typeof priorityMultipliers] || 1;

  // Apply early completion bonus
  if (isEarlyCompletion) {
    xp *= EARLY_COMPLETION_BONUS_MULTIPLIER;
  }

  return Math.floor(xp);
}

/**
 * Get level information for a given XP amount
 */
export async function getLevelFromXP(totalXP: number): Promise<{
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
}> {
  const levelList = await db.select().from(levels).orderBy(levels.levelNumber);

  // Find current level
  let currentLevel = 1;
  let currentLevelRequirement = 0;
  let nextLevelRequirement = 100; // Default for level 2

  for (let i = 0; i < levelList.length; i++) {
    if (totalXP >= levelList[i].xpRequired) {
      currentLevel = levelList[i].levelNumber;
      currentLevelRequirement = levelList[i].xpRequired;
      nextLevelRequirement = levelList[i + 1]?.xpRequired || levelList[i].xpRequired + 1000;
    } else {
      break;
    }
  }

  const xpInCurrentLevel = totalXP - currentLevelRequirement;
  const xpNeededForNextLevel = nextLevelRequirement - currentLevelRequirement;
  const progress = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    level: currentLevel,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForNextLevel,
    progress,
  };
}

/**
 * Award XP to user and check for level up
 */
export async function awardXP(
  userId: string,
  xpAmount: number
): Promise<{
  newTotalXP: number;
  leveledUp: boolean;
  newLevel?: number;
  coinsEarned?: number;
}> {
  // Get or create user level record
  let [userLevel] = await db
    .select()
    .from(userLevels)
    .where(eq(userLevels.userId, userId))
    .limit(1);

  if (!userLevel) {
    [userLevel] = await db
      .insert(userLevels)
      .values({ userId })
      .returning();
  }

  const oldTotalXP = userLevel.totalXp;
  const newTotalXP = oldTotalXP + xpAmount;

  // Get old and new level info
  const oldLevelInfo = await getLevelFromXP(oldTotalXP);
  const newLevelInfo = await getLevelFromXP(newTotalXP);

  const leveledUp = newLevelInfo.level > oldLevelInfo.level;
  let coinsEarned = 0;

  if (leveledUp) {
    const levelsGained = newLevelInfo.level - oldLevelInfo.level;
    coinsEarned = levelsGained * COINS_PER_LEVEL;

    // Award coins
    await awardCoins(userId, coinsEarned, "Level up reward");
  }

  // Update user level
  await db
    .update(userLevels)
    .set({
      currentLevel: newLevelInfo.level,
      currentXp: newLevelInfo.currentLevelXP,
      totalXp: newTotalXP,
      updatedAt: new Date(),
    })
    .where(eq(userLevels.userId, userId));

  // Also update user stats total points
  await db
    .update(userStats)
    .set({
      totalPoints: newTotalXP,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  // Also update legacy points in users table
  await db
    .update(users)
    .set({ points: newTotalXP })
    .where(eq(users.id, userId));

  // Broadcast points earned
  broadcastPointsEarned(userId, xpAmount, "XP earned");

  return {
    newTotalXP,
    leveledUp,
    newLevel: leveledUp ? newLevelInfo.level : undefined,
    coinsEarned: leveledUp ? coinsEarned : undefined,
  };
}

/**
 * Award coins to user
 */
export async function awardCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<UserCoinsType> {
  // Get or create user coins record
  let [userCoinsRecord] = await db
    .select()
    .from(userCoins)
    .where(eq(userCoins.userId, userId))
    .limit(1);

  if (!userCoinsRecord) {
    [userCoinsRecord] = await db
      .insert(userCoins)
      .values({ userId })
      .returning();
  }

  // Update coins
  const [updated] = await db
    .update(userCoins)
    .set({
      balance: userCoinsRecord.balance + amount,
      totalEarned: userCoinsRecord.totalEarned + amount,
      updatedAt: new Date(),
    })
    .where(eq(userCoins.userId, userId))
    .returning();

  // Broadcast coins earned
  broadcastPointsEarned(userId, amount, reason);

  return updated;
}

/**
 * Spend coins from user balance
 */
export async function spendCoins(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const [userCoinsRecord] = await db
    .select()
    .from(userCoins)
    .where(eq(userCoins.userId, userId))
    .limit(1);

  if (!userCoinsRecord) {
    return { success: false, error: "User coins record not found" };
  }

  if (userCoinsRecord.balance < amount) {
    return { success: false, error: "Insufficient coins" };
  }

  const [updated] = await db
    .update(userCoins)
    .set({
      balance: userCoinsRecord.balance - amount,
      totalSpent: userCoinsRecord.totalSpent + amount,
      updatedAt: new Date(),
    })
    .where(eq(userCoins.userId, userId))
    .returning();

  return { success: true, newBalance: updated.balance };
}

/**
 * Update user streak and check for achievements
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakMaintained: boolean;
  coinsEarned?: number;
  badgeEarned?: Badge;
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get or create streak record
  let [streakRecord] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);

  if (!streakRecord) {
    [streakRecord] = await db
      .insert(streaks)
      .values({
        userId,
        lastStudyDate: today,
      })
      .returning();
  }

  const lastStudyDate = streakRecord.lastStudyDate
    ? new Date(streakRecord.lastStudyDate)
    : null;

  let currentStreak = streakRecord.currentStreak;
  let streakMaintained = true;
  let coinsEarned: number | undefined;
  let badgeEarned: Badge | undefined;

  if (!lastStudyDate) {
    // First study session ever
    currentStreak = 1;
  } else {
    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastStudy === 0) {
      // Studied today already, no change
      streakMaintained = true;
    } else if (daysSinceLastStudy === 1) {
      // Consecutive day
      currentStreak += 1;

      // Check for streak milestone rewards
      if (currentStreak === 7) {
        coinsEarned = STREAK_MILESTONE_COINS[0];
        await awardCoins(userId, coinsEarned, "7-day streak milestone");
      } else if (currentStreak === 14) {
        coinsEarned = STREAK_MILESTONE_COINS[1];
        await awardCoins(userId, coinsEarned, "14-day streak milestone");
      } else if (currentStreak === 30) {
        coinsEarned = STREAK_MILESTONE_COINS[2];
        await awardCoins(userId, coinsEarned, "30-day streak milestone");
      } else if (currentStreak === 100) {
        coinsEarned = STREAK_MILESTONE_COINS[3];
        await awardCoins(userId, coinsEarned, "100-day streak milestone");
      }

      // Check for streak badges
      if (currentStreak === 5) {
        badgeEarned = await awardBadgeByRequirement(userId, "5-day-streak");
      } else if (currentStreak === 10) {
        badgeEarned = await awardBadgeByRequirement(userId, "10-day-streak");
      } else if (currentStreak === 30) {
        badgeEarned = await awardBadgeByRequirement(userId, "30-day-streak");
      }
    } else {
      // Streak broken
      currentStreak = 1;
      streakMaintained = false;
    }
  }

  // Update longest streak if current exceeds it
  const longestStreak = Math.max(currentStreak, streakRecord.longestStreak);

  // Update streak record
  await db
    .update(streaks)
    .set({
      currentStreak,
      longestStreak,
      lastStudyDate: today,
      updatedAt: new Date(),
    })
    .where(eq(streaks.userId, userId));

  return {
    currentStreak,
    longestStreak,
    streakMaintained,
    coinsEarned,
    badgeEarned,
  };
}

/**
 * Award a badge to user by requirement identifier
 */
export async function awardBadgeByRequirement(
  userId: string,
  requirement: string
): Promise<Badge | undefined> {
  // Find badge definition
  const [badgeDefinition] = await db
    .select()
    .from(badges)
    .where(eq(badges.requirement, requirement))
    .limit(1);

  if (!badgeDefinition) {
    return undefined;
  }

  // Check if user already has this badge
  const [existingUserBadge] = await db
    .select()
    .from(userBadges)
    .where(
      and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeDefinition.id)
      )
    )
    .limit(1);

  if (existingUserBadge) {
    return undefined; // Already has badge
  }

  // Award badge
  await db.insert(userBadges).values({
    userId,
    badgeId: badgeDefinition.id,
  });

  return badgeDefinition;
}

/**
 * Check and award achievements based on user stats
 */
export async function checkAndAwardAchievements(userId: string): Promise<Badge[]> {
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (!stats) return [];

  const newBadges: Badge[] = [];

  // Check games played achievements
  if (stats.gamesPlayed >= 10) {
    const badge = await awardBadgeByRequirement(userId, "game-master-10");
    if (badge) newBadges.push(badge);
  }
  if (stats.gamesPlayed >= 50) {
    const badge = await awardBadgeByRequirement(userId, "game-master-50");
    if (badge) newBadges.push(badge);
  }

  // Check study sessions achievements
  if (stats.studySessions >= 10) {
    const badge = await awardBadgeByRequirement(userId, "focus-master-10");
    if (badge) newBadges.push(badge);
  }
  if (stats.studySessions >= 50) {
    const badge = await awardBadgeByRequirement(userId, "focus-master-50");
    if (badge) newBadges.push(badge);
  }

  // Check total points achievements
  if (stats.totalPoints >= 1000) {
    const badge = await awardBadgeByRequirement(userId, "scholar-1000");
    if (badge) newBadges.push(badge);
  }
  if (stats.totalPoints >= 5000) {
    const badge = await awardBadgeByRequirement(userId, "scholar-5000");
    if (badge) newBadges.push(badge);
  }
  if (stats.totalPoints >= 10000) {
    const badge = await awardBadgeByRequirement(userId, "scholar-10000");
    if (badge) newBadges.push(badge);
  }

  return newBadges;
}

/**
 * Initialize level progression system with default levels
 */
export async function initializeLevels(): Promise<void> {
  const existingLevels = await db.select().from(levels).limit(1);
  if (existingLevels.length > 0) return; // Already initialized

  const levelDefinitions = [
    { levelNumber: 1, xpRequired: 0, title: "Novice", rewards: JSON.stringify({ coins: 0 }) },
    { levelNumber: 2, xpRequired: 100, title: "Learner", rewards: JSON.stringify({ coins: 100 }) },
    { levelNumber: 3, xpRequired: 250, title: "Student", rewards: JSON.stringify({ coins: 100 }) },
    { levelNumber: 4, xpRequired: 500, title: "Scholar", rewards: JSON.stringify({ coins: 100 }) },
    { levelNumber: 5, xpRequired: 1000, title: "Expert", rewards: JSON.stringify({ coins: 100 }) },
    { levelNumber: 6, xpRequired: 2000, title: "Master", rewards: JSON.stringify({ coins: 150 }) },
    { levelNumber: 7, xpRequired: 3500, title: "Sage", rewards: JSON.stringify({ coins: 150 }) },
    { levelNumber: 8, xpRequired: 5000, title: "Guru", rewards: JSON.stringify({ coins: 200 }) },
    { levelNumber: 9, xpRequired: 7500, title: "Legend", rewards: JSON.stringify({ coins: 200 }) },
    { levelNumber: 10, xpRequired: 10000, title: "Grandmaster", rewards: JSON.stringify({ coins: 250 }) },
  ];

  await db.insert(levels).values(levelDefinitions);
}

/**
 * Initialize badge definitions
 */
export async function initializeBadges(): Promise<void> {
  const existingBadges = await db.select().from(badges).limit(1);
  if (existingBadges.length > 0) return; // Already initialized

  const badgeDefinitions = [
    {
      name: "5-Day Streak",
      description: "Study for 5 consecutive days",
      icon: "Flame",
      requirement: "5-day-streak",
      category: "streak",
    },
    {
      name: "10-Day Streak",
      description: "Study for 10 consecutive days",
      icon: "Zap",
      requirement: "10-day-streak",
      category: "streak",
    },
    {
      name: "30-Day Streak",
      description: "Study for 30 consecutive days",
      icon: "Award",
      requirement: "30-day-streak",
      category: "streak",
    },
    {
      name: "Game Master",
      description: "Complete 10 educational games",
      icon: "Gamepad2",
      requirement: "game-master-10",
      category: "achievement",
    },
    {
      name: "Game Legend",
      description: "Complete 50 educational games",
      icon: "Trophy",
      requirement: "game-master-50",
      category: "achievement",
    },
    {
      name: "Focus Master",
      description: "Complete 10 study sessions",
      icon: "Target",
      requirement: "focus-master-10",
      category: "achievement",
    },
    {
      name: "Focus Legend",
      description: "Complete 50 study sessions",
      icon: "Medal",
      requirement: "focus-master-50",
      category: "achievement",
    },
    {
      name: "Rising Scholar",
      description: "Earn 1,000 total XP",
      icon: "BookOpen",
      requirement: "scholar-1000",
      category: "milestone",
    },
    {
      name: "Master Scholar",
      description: "Earn 5,000 total XP",
      icon: "GraduationCap",
      requirement: "scholar-5000",
      category: "milestone",
    },
    {
      name: "Legendary Scholar",
      description: "Earn 10,000 total XP",
      icon: "Crown",
      requirement: "scholar-10000",
      category: "milestone",
    },
    {
      name: "Early Riser",
      description: "Complete a study session before 8 AM",
      icon: "Sunrise",
      requirement: "early-riser",
      category: "achievement",
    },
  ];

  await db.insert(badges).values(badgeDefinitions);
}

// Broadcast points earned to connected WebSocket clients
export function broadcastPointsEarned(userId: string, points: number, reason: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: "points_earned",
        userId,
        points,
        reason,
        timestamp: new Date(),
      }));
    }
  });
}