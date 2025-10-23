import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { storage } from "./storage";
import {
  users,
  userStats,
  games,
  achievementDefinitions,
  userAchievements,
  studyMaterials,
  userActivities,
  gameScores,
  bookmarks,
  userProgress,
  studySessions,
  tasks,
  streaks,
  badges,
  userBadges,
  insertUserSchema,
  insertUserStatsSchema,
  insertGameSchema,
  insertAchievementDefinitionSchema,
  insertUserAchievementSchema,
  insertStudyMaterialSchema,
  insertUserActivitySchema,
  insertGameScoreSchema,
  insertBookmarkSchema,
  insertUserProgressSchema,
  insertStudySessionSchema,
  insertTaskSchema,
  insertStreakSchema,
  insertBadgeSchema,
  insertUserBadgeSchema,
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { setupWebSocket, broadcastLeaderboardUpdate } from "./websocket";
import { healthCheck } from "./middleware/health";
import { cacheMiddleware } from "./middleware/cache";
import { validateRegistration, validateLogin } from "./middleware/validation";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  
  app.get("/api/health", healthCheck);
  // ===== Authentication Routes =====
  
  // Register new user
  app.post("/api/auth/register", validateRegistration, async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      const [newUser] = await db
        .insert(users)
        .values({
          ...validatedData,
          password: hashedPassword,
        })
        .returning();

      // Automatically create user stats for new user
      await db
        .insert(userStats)
        .values({
          userId: newUser.id,
        });

      const { password, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Login user
  app.post("/api/auth/login", validateLogin, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== User Routes =====
  
  // Get current user
  app.get("/api/user/:userId", async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.params.userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get leaderboard using userStats (cached for 1 minute)
  app.get("/api/leaderboard", cacheMiddleware(60000), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      
      const leaderboard = await db
        .select({
          userId: userStats.userId,
          totalPoints: userStats.totalPoints,
          currentRank: userStats.currentRank,
          gamesPlayed: userStats.gamesPlayed,
          studySessions: userStats.studySessions,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(userStats)
        .innerJoin(users, eq(userStats.userId, users.id))
        .orderBy(desc(userStats.totalPoints))
        .limit(limit);

      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user points
  app.patch("/api/user/:userId/points", async (req, res) => {
    try {
      const { points } = req.body;
      
      if (typeof points !== "number") {
        return res.status(400).json({ error: "Points must be a number" });
      }

      // Update both users table (legacy) and userStats table
      const [updatedUser] = await db
        .update(users)
        .set({ points })
        .where(eq(users.id, req.params.userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update userStats with new total points
      const [updatedStats] = await db
        .update(userStats)
        .set({ 
          totalPoints: points,
          updatedAt: new Date() 
        })
        .where(eq(userStats.userId, req.params.userId))
        .returning();

      await updateLeaderboardRanks();
      broadcastLeaderboardUpdate();

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ 
        ...userWithoutPassword,
        stats: updatedStats 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user profile
  app.patch("/api/user/:userId/profile", async (req, res) => {
    try {
      const { fullName, avatarUrl } = req.body;
      
      const updateData: any = {};
      
      if (fullName !== undefined) {
        if (typeof fullName !== "string") {
          return res.status(400).json({ error: "Name must be a string" });
        }
        const trimmedName = fullName.trim();
        if (trimmedName.length === 0) {
          return res.status(400).json({ error: "Name cannot be empty" });
        }
        updateData.fullName = trimmedName;
      }
      
      if (avatarUrl !== undefined) {
        if (typeof avatarUrl !== "string") {
          return res.status(400).json({ error: "Avatar URL must be a string" });
        }
        const trimmedUrl = avatarUrl.trim();
        if (trimmedUrl.length > 0) {
          try {
            new URL(trimmedUrl);
            updateData.avatarUrl = trimmedUrl;
          } catch {
            return res.status(400).json({ error: "Invalid avatar URL format" });
          }
        } else {
          updateData.avatarUrl = trimmedUrl;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.params.userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== User Stats Routes =====
  
  // Get user stats
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, req.params.userId))
        .limit(1);

      if (!stats) {
        return res.status(404).json({ error: "User stats not found" });
      }

      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user stats
  app.patch("/api/stats/:userId", async (req, res) => {
    try {
      const { totalPoints, gamesPlayed, studySessions } = req.body;
      
      const updateData: any = {};
      if (totalPoints !== undefined) updateData.totalPoints = totalPoints;
      if (gamesPlayed !== undefined) updateData.gamesPlayed = gamesPlayed;
      if (studySessions !== undefined) updateData.studySessions = studySessions;
      updateData.updatedAt = new Date();

      const [updatedStats] = await db
        .update(userStats)
        .set(updateData)
        .where(eq(userStats.userId, req.params.userId))
        .returning();

      if (!updatedStats) {
        return res.status(404).json({ error: "User stats not found" });
      }

      await updateLeaderboardRanks();
      broadcastLeaderboardUpdate();

      res.json(updatedStats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Game Routes =====
  
  // Get all games (cached for 5 minutes)
  app.get("/api/games", cacheMiddleware(), async (req, res) => {
    try {
      const allGames = await storage.getAllGames();
      res.json(allGames);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single game
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.gameId);

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.json(game);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Complete a game and earn points
  app.post("/api/games/:gameId/complete", async (req, res) => {
    try {
      const { userId, score } = req.body;

      if (!userId || typeof score !== "number") {
        return res.status(400).json({ error: "userId and score are required" });
      }

      const [game] = await db
        .select()
        .from(games)
        .where(eq(games.id, req.params.gameId))
        .limit(1);

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const pointsEarned = Math.floor((score / 1000) * game.pointsReward);

      const [gameScore] = await db
        .insert(gameScores)
        .values({
          userId,
          gameId: game.id,
          score,
        })
        .returning();

      // Update user points (legacy support)
      await db
        .update(users)
        .set({ points: user.points + pointsEarned })
        .where(eq(users.id, userId));

      // Update user stats
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      const [updatedStats] = await db
        .update(userStats)
        .set({
          totalPoints: (stats?.totalPoints || 0) + pointsEarned,
          gamesPlayed: (stats?.gamesPlayed || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(userStats.userId, userId))
        .returning();

      await db.insert(userActivities).values({
        userId,
        activityType: "game",
        activityTitle: `Completed ${game.title}`,
        pointsEarned,
      });

      await updateLeaderboardRanks();
      broadcastLeaderboardUpdate();

      res.json({
        gameScore,
        pointsEarned,
        totalPoints: updatedStats.totalPoints,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user game scores
  app.get("/api/games/:gameId/scores/:userId", async (req, res) => {
    try {
      const scores = await db
        .select()
        .from(gameScores)
        .where(
          sql`${gameScores.userId} = ${req.params.userId} AND ${gameScores.gameId} = ${req.params.gameId}`
        )
        .orderBy(desc(gameScores.score))
        .limit(10);

      res.json(scores);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Study Material Routes =====
  
  // Get all study materials (cached for 5 minutes)
  app.get("/api/study", cacheMiddleware(), async (req, res) => {
    try {
      const materials = await db.select().from(studyMaterials);
      res.json(materials);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single study material
  app.get("/api/study/:materialId", async (req, res) => {
    try {
      const [material] = await db
        .select()
        .from(studyMaterials)
        .where(eq(studyMaterials.id, req.params.materialId))
        .limit(1);

      if (!material) {
        return res.status(404).json({ error: "Study material not found" });
      }

      res.json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Complete study material and earn points
  app.post("/api/study/:materialId/complete", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const [material] = await db
        .select()
        .from(studyMaterials)
        .where(eq(studyMaterials.id, req.params.materialId))
        .limit(1);

      if (!material) {
        return res.status(404).json({ error: "Study material not found" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user points (legacy support)
      await db
        .update(users)
        .set({ points: user.points + material.pointsReward })
        .where(eq(users.id, userId));

      // Update user stats
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      const [updatedStats] = await db
        .update(userStats)
        .set({
          totalPoints: (stats?.totalPoints || 0) + material.pointsReward,
          studySessions: (stats?.studySessions || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(userStats.userId, userId))
        .returning();

      await db.insert(userActivities).values({
        userId,
        activityType: "study",
        activityTitle: `Completed ${material.title}`,
        pointsEarned: material.pointsReward,
      });

      await updateLeaderboardRanks();
      broadcastLeaderboardUpdate();

      res.json({
        pointsEarned: material.pointsReward,
        totalPoints: updatedStats.totalPoints,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Achievement Routes =====
  
  // Get all achievement definitions (cached for 5 minutes)
  app.get("/api/achievements/definitions", cacheMiddleware(), async (req, res) => {
    try {
      const definitions = await db
        .select()
        .from(achievementDefinitions);

      res.json(definitions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's earned achievements
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const earned = await db
        .select({
          id: userAchievements.id,
          userId: userAchievements.userId,
          achievementId: userAchievements.achievementId,
          earnedAt: userAchievements.earnedAt,
          name: achievementDefinitions.name,
          description: achievementDefinitions.description,
          badgeIcon: achievementDefinitions.badgeIcon,
          pointsRequired: achievementDefinitions.pointsRequired,
          category: achievementDefinitions.category,
        })
        .from(userAchievements)
        .innerJoin(achievementDefinitions, eq(userAchievements.achievementId, achievementDefinitions.id))
        .where(eq(userAchievements.userId, req.params.userId))
        .orderBy(desc(userAchievements.earnedAt));

      res.json(earned);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Unlock achievement for user
  app.post("/api/achievements/unlock", async (req, res) => {
    try {
      const validatedData = insertUserAchievementSchema.parse(req.body);

      // Check if achievement already unlocked
      const existing = await db
        .select()
        .from(userAchievements)
        .where(
          sql`${userAchievements.userId} = ${validatedData.userId} AND ${userAchievements.achievementId} = ${validatedData.achievementId}`
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Achievement already unlocked" });
      }

      const [achievement] = await db
        .insert(userAchievements)
        .values(validatedData)
        .returning();

      res.json(achievement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Bookmark Routes =====
  
  // Get user bookmarks
  app.get("/api/bookmarks/:userId", async (req, res) => {
    try {
      const userBookmarks = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, req.params.userId));

      res.json(userBookmarks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse(req.body);

      const [bookmark] = await db
        .insert(bookmarks)
        .values(validatedData)
        .returning();

      res.json(bookmark);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete bookmark
  app.delete("/api/bookmarks/:userId/:materialId", async (req, res) => {
    try {
      await db
        .delete(bookmarks)
        .where(
          sql`${bookmarks.userId} = ${req.params.userId} AND ${bookmarks.studyMaterialId} = ${req.params.materialId}`
        );

      res.json({ message: "Bookmark deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== User Activity Routes =====
  
  // Get user activities
  app.get("/api/activities/:userId", async (req, res) => {
    try {
      const activities = await db
        .select()
        .from(userActivities)
        .where(eq(userActivities.userId, req.params.userId))
        .orderBy(desc(userActivities.timestamp))
        .limit(50);

      res.json(activities);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== User Progress Routes =====
  
  // Get user progress for all items or by type
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const itemType = req.query.itemType as string | undefined;
      
      let progress;
      if (itemType) {
        progress = await db
          .select()
          .from(userProgress)
          .where(
            sql`${userProgress.userId} = ${req.params.userId} AND ${userProgress.itemType} = ${itemType}`
          )
          .orderBy(desc(userProgress.lastAccessedAt));
      } else {
        progress = await db
          .select()
          .from(userProgress)
          .where(eq(userProgress.userId, req.params.userId))
          .orderBy(desc(userProgress.lastAccessedAt));
      }

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get progress for specific item
  app.get("/api/progress/:userId/:itemId", async (req, res) => {
    try {
      const itemType = req.query.itemType as string;
      
      if (!itemType) {
        return res.status(400).json({ error: "itemType query parameter required" });
      }

      const [progress] = await db
        .select()
        .from(userProgress)
        .where(
          sql`${userProgress.userId} = ${req.params.userId} AND ${userProgress.itemId} = ${req.params.itemId} AND ${userProgress.itemType} = ${itemType}`
        )
        .limit(1);

      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create or update user progress
  app.post("/api/progress", async (req, res) => {
    try {
      const validatedData = insertUserProgressSchema.parse(req.body);
      
      // Check if progress already exists
      const existing = await db
        .select()
        .from(userProgress)
        .where(
          sql`${userProgress.userId} = ${validatedData.userId} AND ${userProgress.itemId} = ${validatedData.itemId} AND ${userProgress.itemType} = ${validatedData.itemType}`
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing progress
        const updateData = req.body;
        updateData.lastAccessedAt = new Date();
        
        const [updated] = await db
          .update(userProgress)
          .set(updateData)
          .where(eq(userProgress.id, existing[0].id))
          .returning();

        return res.json(updated);
      }

      // Create new progress
      const [progress] = await db
        .insert(userProgress)
        .values(validatedData)
        .returning();

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Helper function to update leaderboard ranks
  async function updateLeaderboardRanks() {
    const allStats = await db
      .select()
      .from(userStats)
      .orderBy(desc(userStats.totalPoints));

    for (let i = 0; i < allStats.length; i++) {
      await db
        .update(userStats)
        .set({ currentRank: i + 1, updatedAt: new Date() })
        .where(eq(userStats.id, allStats[i].id));
    }
  }

  // Helper function to update user streak
  async function updateStreak(userId: string) {
    const [userStreak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!userStreak) {
      // Create new streak
      await db.insert(streaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: now,
      });
      return;
    }

    const lastStudy = userStreak.lastStudyDate ? new Date(userStreak.lastStudyDate) : null;
    
    if (!lastStudy) {
      // First study session
      await db
        .update(streaks)
        .set({
          currentStreak: 1,
          longestStreak: 1,
          lastStudyDate: now,
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, userId));
      return;
    }

    const lastStudyDate = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
    const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change to streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      const newCurrentStreak = userStreak.currentStreak + 1;
      await db
        .update(streaks)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(newCurrentStreak, userStreak.longestStreak),
          lastStudyDate: now,
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, userId));
    } else {
      // Streak broken, reset to 1
      await db
        .update(streaks)
        .set({
          currentStreak: 1,
          lastStudyDate: now,
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, userId));
    }
  }

  // ===== Study Sessions Routes (Pomodoro Timer) =====
  
  // Create a new study session
  app.post("/api/study-sessions", async (req, res) => {
    try {
      const validatedData = insertStudySessionSchema.parse(req.body);
      
      const [newSession] = await db
        .insert(studySessions)
        .values(validatedData)
        .returning();

      res.json(newSession);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get study sessions for a user
  app.get("/api/study-sessions/:userId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const sessions = await db
        .select()
        .from(studySessions)
        .where(eq(studySessions.userId, req.params.userId))
        .orderBy(desc(studySessions.startedAt))
        .limit(limit);

      res.json(sessions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Complete a study session and award XP
  app.patch("/api/study-sessions/:sessionId/complete", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session
      const [session] = await db
        .select()
        .from(studySessions)
        .where(eq(studySessions.id, sessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({ error: "Study session not found" });
      }

      if (session.completed) {
        return res.status(400).json({ error: "Session already completed" });
      }

      // Calculate XP based on duration (10 XP per minute)
      const xpEarned = session.duration * 10;

      // Mark session as complete
      const [updatedSession] = await db
        .update(studySessions)
        .set({ 
          completed: true, 
          xpEarned,
          completedAt: new Date() 
        })
        .where(eq(studySessions.id, sessionId))
        .returning();

      // Update user points and stats
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (user) {
        const newPoints = user.points + xpEarned;
        
        await db
          .update(users)
          .set({ points: newPoints })
          .where(eq(users.id, session.userId));

        await db
          .update(userStats)
          .set({ 
            totalPoints: newPoints,
            studySessions: sql`${userStats.studySessions} + 1`,
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, session.userId));

        // Update streak
        await updateStreak(session.userId);
        
        // Record activity
        await db.insert(userActivities).values({
          userId: session.userId,
          activityType: "study_session",
          activityTitle: `Completed ${session.duration} min study session`,
          pointsEarned: xpEarned,
        });

        await updateLeaderboardRanks();
        broadcastLeaderboardUpdate();
      }

      res.json(updatedSession);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Tasks Routes =====
  
  // Get tasks for a user
  app.get("/api/tasks/:userId", async (req, res) => {
    try {
      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, req.params.userId))
        .orderBy(desc(tasks.createdAt));

      res.json(userTasks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      const [newTask] = await db
        .insert(tasks)
        .values(validatedData)
        .returning();

      res.json(newTask);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a task
  app.patch("/api/tasks/:taskId", async (req, res) => {
    try {
      const { title, description, category, priority, deadline } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (priority !== undefined) updateData.priority = priority;
      if (deadline !== undefined) updateData.deadline = deadline;

      const [updatedTask] = await db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, req.params.taskId))
        .returning();

      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Complete a task
  app.patch("/api/tasks/:taskId/complete", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.completed) {
        return res.status(400).json({ error: "Task already completed" });
      }

      // Calculate XP with bonus for early completion
      let totalXp = task.xpReward;
      
      if (task.deadline) {
        const now = new Date();
        const deadline = new Date(task.deadline);
        
        if (now < deadline) {
          totalXp += task.bonusXp;
        }
      }

      // Mark task as complete
      const [updatedTask] = await db
        .update(tasks)
        .set({ 
          completed: true,
          completedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Update user points
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, task.userId))
        .limit(1);

      if (user) {
        const newPoints = user.points + totalXp;
        
        await db
          .update(users)
          .set({ points: newPoints })
          .where(eq(users.id, task.userId));

        await db
          .update(userStats)
          .set({ 
            totalPoints: newPoints,
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, task.userId));

        // Record activity
        await db.insert(userActivities).values({
          userId: task.userId,
          activityType: "task_completed",
          activityTitle: task.title,
          pointsEarned: totalXp,
        });

        await updateLeaderboardRanks();
        broadcastLeaderboardUpdate();
      }

      res.json({ ...updatedTask, xpEarned: totalXp });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:taskId", async (req, res) => {
    try {
      const [deletedTask] = await db
        .delete(tasks)
        .where(eq(tasks.id, req.params.taskId))
        .returning();

      if (!deletedTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Streaks Routes =====
  
  // Get streak for a user
  app.get("/api/streaks/:userId", async (req, res) => {
    try {
      const [userStreak] = await db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, req.params.userId))
        .limit(1);

      if (!userStreak) {
        // Create a new streak for the user
        const [newStreak] = await db
          .insert(streaks)
          .values({ userId: req.params.userId })
          .returning();
        
        return res.json(newStreak);
      }

      res.json(userStreak);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Badges Routes =====
  
  // Get all badges
  app.get("/api/badges", cacheMiddleware(), async (req, res) => {
    try {
      const allBadges = await db
        .select()
        .from(badges);

      res.json(allBadges);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user badges
  app.get("/api/user-badges/:userId", async (req, res) => {
    try {
      const earnedBadges = await db
        .select({
          id: userBadges.id,
          badgeId: userBadges.badgeId,
          earnedAt: userBadges.earnedAt,
          name: badges.name,
          description: badges.description,
          icon: badges.icon,
          category: badges.category,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, req.params.userId))
        .orderBy(desc(userBadges.earnedAt));

      res.json(earnedBadges);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Seed Data Route (for development) =====
  
  app.post("/api/seed", async (req, res) => {
    try {
      // Seed games
      const gamesToSeed = [
        {
          title: "Math Quiz Challenge",
          description: "Test your mathematical skills with rapid-fire questions",
          difficulty: "Medium",
          pointsReward: 150,
          category: "Mathematics",
          thumbnailUrl: "/assets/math-game.png",
          instructions: "Answer as many questions correctly as possible within the time limit",
        },
        {
          title: "Science Trivia Master",
          description: "Answer questions about physics, chemistry, and biology",
          difficulty: "Hard",
          pointsReward: 200,
          category: "Science",
          thumbnailUrl: "/assets/science-game.png",
          instructions: "Choose the correct answer for each science question",
        },
        {
          title: "Geography Quest",
          description: "Explore the world with geography questions",
          difficulty: "Easy",
          pointsReward: 100,
          category: "Geography",
          thumbnailUrl: "/assets/geography-game.png",
          instructions: "Test your knowledge of world geography",
        },
      ];

      const existingGames = await db.select().from(games);
      
      if (existingGames.length === 0) {
        await db.insert(games).values(gamesToSeed);
      }

      // Seed study materials
      const materialsToSeed = [
        {
          title: "Algebra Fundamentals",
          description: "Master the basics of algebraic equations",
          subject: "Mathematics",
          difficulty: "Easy",
          content: "Learn about variables, equations, and algebraic principles",
          pointsReward: 100,
        },
        {
          title: "Newton's Laws of Motion",
          description: "Understanding classical mechanics",
          subject: "Physics",
          difficulty: "Medium",
          content: "Explore the three fundamental laws of motion",
          pointsReward: 150,
        },
      ];

      const existingMaterials = await db.select().from(studyMaterials);
      
      if (existingMaterials.length === 0) {
        await db.insert(studyMaterials).values(materialsToSeed);
      }

      // Seed achievement definitions
      const achievementsToSeed = [
        {
          name: "First Steps",
          description: "Earn your first 10 points",
          badgeIcon: "badge-first-steps",
          pointsRequired: 10,
          category: "Beginner",
        },
        {
          name: "Rising Star",
          description: "Reach 100 points",
          badgeIcon: "badge-rising-star",
          pointsRequired: 100,
          category: "Progress",
        },
        {
          name: "Knowledge Seeker",
          description: "Complete 5 study sessions",
          badgeIcon: "badge-knowledge-seeker",
          pointsRequired: 500,
          category: "Study",
        },
        {
          name: "Gaming Master",
          description: "Win 10 games",
          badgeIcon: "badge-gaming-master",
          pointsRequired: 1000,
          category: "Gaming",
        },
        {
          name: "Top Performer",
          description: "Reach the top 10 on the leaderboard",
          badgeIcon: "badge-top-performer",
          pointsRequired: 5000,
          category: "Achievement",
        },
        {
          name: "Legendary",
          description: "Earn 10,000 points",
          badgeIcon: "badge-legendary",
          pointsRequired: 10000,
          category: "Elite",
        },
      ];

      const existingAchievements = await db.select().from(achievementDefinitions);
      
      if (existingAchievements.length === 0) {
        await db.insert(achievementDefinitions).values(achievementsToSeed);
      }

      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
