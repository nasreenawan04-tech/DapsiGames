import {
  type User,
  type InsertUser,
  type UserStats,
  type InsertUserStats,
  type Game,
  type InsertGame,
  type AchievementDefinition,
  type InsertAchievementDefinition,
  type UserAchievement,
  type InsertUserAchievement,
  type StudyMaterial,
  type InsertStudyMaterial,
  type UserActivity,
  type InsertUserActivity,
  type GameScore,
  type InsertGameScore,
  type Bookmark,
  type InsertBookmark,
  type UserProgress,
  type InsertUserProgress,
  type Task,
  type InsertTask,
  type StudySession,
  type InsertStudySession,
  type Friendship,
  type InsertFriendship,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type Streak,
  type InsertStreak,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(userId: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  addUserPoints(userId: string, points: number): Promise<User | null>;
  getAllUsers(): Promise<User[]>;

  // User Stats methods
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats>;
  getLeaderboard(limit?: number): Promise<(UserStats & { user: User })[]>;

  // Game methods
  getGame(id: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;

  // Achievement Definition methods
  getAchievementDefinition(id: string): Promise<AchievementDefinition | undefined>;
  getAllAchievementDefinitions(): Promise<AchievementDefinition[]>;
  createAchievementDefinition(definition: InsertAchievementDefinition): Promise<AchievementDefinition>;

  // User Achievement methods
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;

  // Study Material methods
  getStudyMaterial(id: string): Promise<StudyMaterial | undefined>;
  getAllStudyMaterials(): Promise<StudyMaterial[]>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;

  // User Activity methods
  getUserActivities(userId: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  createActivity(data: InsertUserActivity): Promise<UserActivity>;

  // Game Score methods
  getUserGameScores(userId: string, gameId?: string): Promise<GameScore[]>;
  createGameScore(score: InsertGameScore): Promise<GameScore>;

  // Bookmark methods
  getUserBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: string, studyMaterialId: string): Promise<void>;

  // User Progress methods
  getUserProgress(userId: string, itemType?: string): Promise<UserProgress[]>;
  getProgressForItem(userId: string, itemId: string, itemType: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: string, itemId: string, itemType: string, updates: Partial<UserProgress>): Promise<UserProgress>;

  // Task methods
  getUserTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  completeTask(taskId: string): Promise<Task | null>;

  // StudySession methods
  getUserStudySessions(userId: string): Promise<StudySession[]>;
  getStudySession(id: string): Promise<StudySession | undefined>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession>;
  completeStudySession(sessionId: string): Promise<StudySession | null>;

  // Friendship methods
  getUserFriendships(userId: string): Promise<Friendship[]>;
  getFriendship(userId: string, friendId: string): Promise<Friendship | null>;
  checkFriendship(userId: string, friendId: string): Promise<Friendship | null>;
  createFriendRequest(userId: string, friendId: string): Promise<Friendship>;
  acceptFriendRequest(requestId: string): Promise<Friendship | null>;
  rejectFriendRequest(requestId: string): Promise<Friendship | null>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  updateFriendship(friendshipId: string, data: Partial<Friendship>): Promise<Friendship | null>;
  deleteFriendship(friendshipId: string): Promise<void>;


  // Group methods
  getGroup(id: string): Promise<Group | undefined>;
  getAllGroups(): Promise<Group[]>;
  getUserGroups(userId: string): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(groupId: string, updates: Partial<Group>): Promise<Group>;

  // GroupMember methods
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  createGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  joinGroup(groupId: string, userId: string): Promise<GroupMember>;
  deleteGroupMember(groupId: string, userId: string): Promise<void>;

  // Streak methods
  getUserStreak(userId: string): Promise<Streak | undefined>;
  createStreak(streak: InsertStreak): Promise<Streak>;
  updateStreak(userId: string): Promise<void>;
  updateStreakData(userId: string, updates: Partial<Streak>): Promise<Streak>;

  // Pomodoro Timer methods (assuming these would be added to IStorage)
  getStudySessionByUserIdAndStatus(userId: string, completed: boolean): Promise<StudySession | undefined>;
  startStudySession(userId: string, durationMinutes: number): Promise<StudySession>;
  stopStudySession(sessionId: string, xpEarned: number): Promise<StudySession | null>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userStats: Map<string, UserStats>;
  private games: Map<string, Game>;
  private achievementDefinitions: Map<string, AchievementDefinition>;
  private userAchievements: Map<string, UserAchievement>;
  private studyMaterials: Map<string, StudyMaterial>;
  private userActivities: Map<string, UserActivity>;
  private gameScores: Map<string, GameScore>;
  private bookmarks: Map<string, Bookmark>;
  private userProgress: Map<string, UserProgress>;
  private tasks: Map<string, Task>;
  private studySessions: Map<string, StudySession>;
  private friendships: Map<string, Friendship>;
  private groups: Map<string, Group>;
  private groupMembers: Map<string, GroupMember>;
  private streaks: Map<string, Streak>;
  // Added for group messages, assuming GroupMessage type exists in @shared/schema
  private groupMessages: Map<string, any>; // Replace 'any' with actual GroupMessage type

  constructor() {
    this.users = new Map();
    this.userStats = new Map();
    this.games = new Map();
    this.achievementDefinitions = new Map();
    this.userAchievements = new Map();
    this.studyMaterials = new Map();
    this.userActivities = new Map();
    this.gameScores = new Map();
    this.bookmarks = new Map();
    this.userProgress = new Map();
    this.tasks = new Map();
    this.studySessions = new Map();
    this.friendships = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.streaks = new Map();
    this.groupMessages = new Map(); // Initialize group messages map

    this.seedInitialData();
  }

  private seedInitialData(): void {
    const sampleGames: Game[] = [
      {
        id: 'math-quiz',
        title: 'Math Blitz',
        description: 'Test your arithmetic skills with rapid-fire math problems. Answer as many as you can before time runs out!',
        difficulty: 'Easy',
        pointsReward: 10,
        category: 'Mathematics',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400',
        instructions: 'Solve math problems as quickly as possible. Each correct answer earns you points. You have 60 seconds!'
      },
      {
        id: 'word-scramble',
        title: 'Word Scramble',
        description: 'Unscramble letters to form valid words. Perfect for improving vocabulary and spelling.',
        difficulty: 'Easy',
        pointsReward: 15,
        category: 'Language',
        thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
        instructions: 'Rearrange the scrambled letters to form a valid word. Hint: words are related to common topics.'
      },
      {
        id: 'science-trivia',
        title: 'Chemistry Quiz',
        description: 'Challenge your knowledge of the periodic table, chemical reactions, and molecular structures.',
        difficulty: 'Medium',
        pointsReward: 20,
        category: 'Science',
        thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
        instructions: 'Answer multiple choice questions about chemistry concepts. Each correct answer adds to your score!'
      },
      {
        id: 'geography-quest',
        title: 'Geography Challenge',
        description: 'Test your knowledge of world capitals, countries, and landmarks.',
        difficulty: 'Medium',
        pointsReward: 25,
        category: 'Geography',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400',
        instructions: 'Identify countries, capitals, and geographical features. Explore the world from your screen!'
      },
      {
        id: 'code-breaker',
        title: 'Code Breaker',
        description: 'Solve programming logic puzzles and algorithm challenges.',
        difficulty: 'Hard',
        pointsReward: 30,
        category: 'Computer Science',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
        instructions: 'Analyze code snippets and determine the output or fix bugs. Test your programming knowledge!'
      },
      {
        id: 'history-timeline',
        title: 'History Timeline',
        description: 'Arrange historical events in chronological order to test your knowledge of world history.',
        difficulty: 'Medium',
        pointsReward: 20,
        category: 'History',
        thumbnailUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
        instructions: 'Drag and drop events to place them in the correct chronological order.'
      }
    ];

    sampleGames.forEach(game => this.games.set(game.id, game));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      points: 0,
      rank: null,
      avatarUrl: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);

    // Automatically create user stats
    await this.createUserStats({ userId: id });

    return user;
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    user.points = points;
    this.users.set(userId, user);
    await this.updateLeaderboardRanks();
    return user;
  }

  async addUserPoints(userId: string, points: number): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updated: User = {
      ...user,
      points: user.points + points,
    };
    this.users.set(userId, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => b.points - a.points);
  }

  private async updateLeaderboardRanks(): Promise<void> {
    const allStats = Array.from(this.userStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints);

    allStats.forEach((stats, index) => {
      stats.currentRank = index + 1;
      this.userStats.set(stats.id, stats);
    });
  }

  // Game methods
  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = { ...insertGame, id };
    this.games.set(id, game);
    return game;
  }

  // User Stats methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find((stats) => stats.userId === userId);
  }

  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const id = randomUUID();
    const stats: UserStats = {
      ...insertStats,
      id,
      totalPoints: 0,
      currentRank: null,
      gamesPlayed: 0,
      studySessions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userStats.set(id, stats);
    await this.updateLeaderboardRanks();
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    if (!stats) throw new Error("User stats not found");

    const updated: UserStats = {
      ...stats,
      ...updates,
      updatedAt: new Date(),
    };
    this.userStats.set(stats.id, updated);
    await this.updateLeaderboardRanks();
    return updated;
  }

  async getLeaderboard(limit = 100): Promise<(UserStats & { user: User })[]> {
    const allStats = Array.from(this.userStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return allStats.map((stats) => {
      const user = this.users.get(stats.userId);
      if (!user) throw new Error(`User not found for stats: ${stats.userId}`);
      return { ...stats, user };
    });
  }

  // Achievement Definition methods
  async getAchievementDefinition(id: string): Promise<AchievementDefinition | undefined> {
    return this.achievementDefinitions.get(id);
  }

  async getAllAchievementDefinitions(): Promise<AchievementDefinition[]> {
    return Array.from(this.achievementDefinitions.values());
  }

  async createAchievementDefinition(insertDefinition: InsertAchievementDefinition): Promise<AchievementDefinition> {
    const id = randomUUID();
    const definition: AchievementDefinition = { ...insertDefinition, id };
    this.achievementDefinitions.set(id, definition);
    return definition;
  }

  // User Achievement methods
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }

  async createUserAchievement(insertAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const achievement: UserAchievement = {
      ...insertAchievement,
      id,
      earnedAt: new Date(),
    };
    this.userAchievements.set(id, achievement);
    return achievement;
  }

  // Study Material methods
  async getStudyMaterial(id: string): Promise<StudyMaterial | undefined> {
    return this.studyMaterials.get(id);
  }

  async getAllStudyMaterials(): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values());
  }

  async createStudyMaterial(insertMaterial: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = randomUUID();
    const material: StudyMaterial = { ...insertMaterial, id };
    this.studyMaterials.set(id, material);
    return material;
  }

  // User Activity methods
  async getUserActivities(userId: string): Promise<UserActivity[]> {
    return Array.from(this.userActivities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const id = randomUUID();
    const activity: UserActivity = {
      ...insertActivity,
      id,
      timestamp: new Date(),
    };
    this.userActivities.set(id, activity);
    return activity;
  }

  async createActivity(data: InsertUserActivity): Promise<UserActivity> {
    const id = randomUUID();
    const activity: UserActivity = {
      ...data,
      id,
      timestamp: new Date(),
    };
    this.userActivities.set(id, activity);
    return activity;
  }

  // Game Score methods
  async getUserGameScores(userId: string, gameId?: string): Promise<GameScore[]> {
    return Array.from(this.gameScores.values()).filter(
      (score) =>
        score.userId === userId && (!gameId || score.gameId === gameId)
    );
  }

  async createGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const id = randomUUID();
    const score: GameScore = {
      ...insertScore,
      id,
      completedAt: new Date(),
    };
    this.gameScores.set(id, score);
    return score;
  }

  // Bookmark methods
  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.userId === userId
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: string, studyMaterialId: string): Promise<void> {
    const bookmark = Array.from(this.bookmarks.values()).find(
      (b) => b.userId === userId && b.studyMaterialId === studyMaterialId
    );
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
    }
  }

  // User Progress methods
  async getUserProgress(userId: string, itemType?: string): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) =>
        progress.userId === userId && (!itemType || progress.itemType === itemType)
    );
  }

  async getProgressForItem(userId: string, itemId: string, itemType: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) =>
        progress.userId === userId &&
        progress.itemId === itemId &&
        progress.itemType === itemType
    );
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const progress: UserProgress = {
      ...insertProgress,
      id,
      progressPercentage: 0,
      completed: false,
      lastAccessedAt: new Date(),
      completedAt: null,
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async updateUserProgress(
    userId: string,
    itemId: string,
    itemType: string,
    updates: Partial<UserProgress>
  ): Promise<UserProgress> {
    const progress = await this.getProgressForItem(userId, itemId, itemType);
    if (!progress) throw new Error("User progress not found");

    const updated: UserProgress = {
      ...progress,
      ...updates,
      lastAccessedAt: new Date(),
    };
    this.userProgress.set(progress.id, updated);
    return updated;
  }

  // Task methods
  async getUserTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.userId === userId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      completed: false,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error("Task not found");

    const updated: Task = {
      ...task,
      ...updates,
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }

  async completeTask(taskId: string): Promise<Task | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const updated: Task = {
      ...task,
      completed: true,
      completedAt: new Date(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  // StudySession methods
  async getUserStudySessions(userId: string): Promise<StudySession[]> {
    return Array.from(this.studySessions.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getStudySession(id: string): Promise<StudySession | undefined> {
    return this.studySessions.get(id);
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = randomUUID();
    const session: StudySession = {
      ...insertSession,
      id,
      xpEarned: 0,
      completed: false,
      startedAt: new Date(),
      completedAt: null,
    };
    this.studySessions.set(id, session);
    return session;
  }

  async updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
    const session = this.studySessions.get(sessionId);
    if (!session) throw new Error("Study session not found");

    const updated: StudySession = {
      ...session,
      ...updates,
    };
    this.studySessions.set(sessionId, updated);
    return updated;
  }

  async completeStudySession(sessionId: string): Promise<StudySession | null> {
    const session = this.studySessions.get(sessionId);
    if (!session) return null;

    const xpEarned = session.duration * 10; // 10 XP per minute
    const updated: StudySession = {
      ...session,
      completed: true,
      completedAt: new Date(),
      xpEarned,
    };
    this.studySessions.set(sessionId, updated);

    // Update user stats and streak
    const userStats = await this.getUserStats(session.userId);
    if (userStats) {
      await this.updateUserStats(session.userId, {
        studySessions: userStats.studySessions + 1,
        totalPoints: userStats.totalPoints + xpEarned,
      });
    }
    await this.updateStreak(session.userId);

    return updated;
  }

  // Friendship methods
  async getUserFriendships(userId: string): Promise<Friendship[]> {
    return Array.from(this.friendships.values()).filter(
      (f) => f.userId === userId || f.friendId === userId
    );
  }

  async getFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    return Array.from(this.friendships.values()).find(
      (f) => (f.userId === userId && f.friendId === friendId) ||
             (f.userId === friendId && f.friendId === userId)
    ) || null;
  }

  async checkFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    return this.getFriendship(userId, friendId);
  }

  async createFriendRequest(userId: string, friendId: string): Promise<Friendship> {
    const id = randomUUID();
    const friendship: Friendship = {
      id,
      userId,
      friendId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async updateFriendship(friendshipId: string, data: Partial<Friendship>): Promise<Friendship | null> {
    const friendship = this.friendships.get(friendshipId);
    if (!friendship) return null;

    const updated: Friendship = {
      ...friendship,
      ...data,
      updatedAt: new Date(),
    };
    this.friendships.set(friendshipId, updated);
    return updated;
  }

  async deleteFriendship(friendshipId: string): Promise<void> {
    this.friendships.delete(friendshipId);
  }

  async getUserFriends(userId: string): Promise<any[]> {
    const friendships = Array.from(this.friendships.values()).filter(
      (f) => (f.userId === userId || f.friendId === userId) && f.status === "accepted"
    );
    return friendships.map(f => {
      const friendId = f.userId === userId ? f.friendId : f.userId;
      const friend = this.users.get(friendId);
      if (!friend) return null;
      return {
        id: f.id,
        userId: f.userId,
        friendId: f.friendId,
        status: f.status,
        createdAt: f.createdAt,
        friendName: friend.fullName,
        friendEmail: friend.email,
        friendPoints: friend.points,
        friendAvatarUrl: friend.avatarUrl,
      };
    }).filter(f => f !== null);
  }

  async getFriendRequests(userId: string): Promise<any[]> {
    const friendships = Array.from(this.friendships.values()).filter(
      (f) => f.friendId === userId && f.status === "pending"
    );
    return friendships.map(f => {
      const sender = this.users.get(f.userId);
      if (!sender) return null;
      return {
        id: f.id,
        userId: f.userId,
        friendId: f.friendId,
        status: f.status,
        createdAt: f.createdAt,
        senderName: sender.fullName,
        senderEmail: sender.email,
        senderAvatarUrl: sender.avatarUrl,
      };
    }).filter(f => f !== null);
  }

  async acceptFriendRequest(requestId: string): Promise<Friendship | null> {
    const friendship = this.friendships.get(requestId);
    if (!friendship || friendship.status !== "pending") return null;

    const updated: Friendship = {
      ...friendship,
      status: "accepted",
      updatedAt: new Date(),
    };
    this.friendships.set(requestId, updated);
    return updated;
  }

  async rejectFriendRequest(requestId: string): Promise<Friendship | null> {
    const friendship = this.friendships.get(requestId);
    if (!friendship || friendship.status !== "pending") return null;

    const updated: Friendship = {
      ...friendship,
      status: "rejected",
      updatedAt: new Date(),
    };
    this.friendships.set(requestId, updated);
    return updated;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = Array.from(this.friendships.values()).find(
      (f) =>
        (f.userId === userId && f.friendId === friendId && f.status === "accepted") ||
        (f.userId === friendId && f.friendId === userId && f.status === "accepted")
    );
    if (friendship) {
      this.friendships.delete(friendship.id);
    }
  }

  // Group methods
  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberOf = Array.from(this.groupMembers.values())
      .filter(m => m.userId === userId)
      .map(m => m.groupId);

    return Array.from(this.groups.values())
      .filter(g => memberOf.includes(g.id));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const group: Group = {
      ...insertGroup,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    const updated: Group = {
      ...group,
      ...updates,
      updatedAt: new Date(),
    };
    this.groups.set(groupId, updated);
    return updated;
  }

  // GroupMember methods
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter((m) => m.groupId === groupId);
  }

  async createGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = randomUUID();
    const member: GroupMember = {
      ...insertMember,
      id,
      joinedAt: new Date(),
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const id = randomUUID();
    const member: GroupMember = {
      id,
      groupId,
      userId,
      role: "member",
      joinedAt: new Date(),
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async deleteGroupMember(groupId: string, userId: string): Promise<void> {
    const member = Array.from(this.groupMembers.values()).find(
      (m) => m.groupId === groupId && m.userId === userId
    );
    if (member) {
      this.groupMembers.delete(member.id);
    }
  }

  // Streak methods
  async getUserStreak(userId: string): Promise<Streak | undefined> {
    return Array.from(this.streaks.values()).find(
      (streak) => streak.userId === userId
    );
  }

  async createStreak(insertStreak: InsertStreak): Promise<Streak> {
    const id = randomUUID();
    const streak: Streak = {
      ...insertStreak,
      id,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      updatedAt: new Date(),
    };
    this.streaks.set(id, streak);
    return streak;
  }

  async updateStreakData(userId: string, updates: Partial<Streak>): Promise<Streak> {
    const streak = await this.getUserStreak(userId);
    if (!streak) throw new Error("Streak not found");

    const updated: Streak = {
      ...streak,
      ...updates,
      updatedAt: new Date(),
    };
    this.streaks.set(streak.id, updated);
    return updated;
  }

  // Pomodoro Timer methods
  async getStudySessionByUserIdAndStatus(userId: string, completed: boolean): Promise<StudySession | undefined> {
    return Array.from(this.studySessions.values()).find(
      (session) => session.userId === userId && session.completed === completed
    );
  }

  async startStudySession(userId: string, durationMinutes: number): Promise<StudySession> {
    const id = randomUUID();
    const session: StudySession = {
      id,
      userId,
      duration: durationMinutes,
      xpEarned: 0,
      completed: false,
      startedAt: new Date(),
      completedAt: null,
    };
    this.studySessions.set(id, session);
    return session;
  }

  async stopStudySession(sessionId: string, xpEarned: number): Promise<StudySession | null> {
    const session = this.studySessions.get(sessionId);
    if (!session) return null;

    const updated: StudySession = {
      ...session,
      completed: true,
      completedAt: new Date(),
      xpEarned,
    };
    this.studySessions.set(sessionId, updated);

    // Update user stats and streak
    const userStats = await this.getUserStats(session.userId);
    if (userStats) {
      await this.updateUserStats(session.userId, {
        studySessions: userStats.studySessions + 1,
        totalPoints: userStats.totalPoints + xpEarned,
      });
    }
    await this.updateStreak(session.userId); // This method will handle the logic for updating streak

    return updated;
  }

  // Method to update streak, called after study sessions or tasks are completed
  async updateStreak(userId: string): Promise<void> {
    const existing = await this.getUserStreak(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!existing) {
      const id = randomUUID();
      const streak: Streak = {
        id,
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(), // Initialize with today
        updatedAt: new Date(),
      };
      this.streaks.set(id, streak);
    } else {
      const lastDate = existing.lastStudyDate ? new Date(existing.lastStudyDate) : null;
      if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Same day, no change needed for streak count, update lastStudyDate if needed
          const updated: Streak = {
            ...existing,
            lastStudyDate: new Date(), // Update to latest activity date
            updatedAt: new Date(),
          };
          this.streaks.set(existing.id, updated);
          return;
        } else if (daysDiff === 1) {
          // Consecutive day
          const newStreak = existing.currentStreak + 1;
          const updated: Streak = {
            ...existing,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, existing.longestStreak),
            lastStudyDate: new Date(),
            updatedAt: new Date(),
          };
          this.streaks.set(existing.id, updated);
        } else {
          // Streak broken
          const updated: Streak = {
            ...existing,
            currentStreak: 1,
            lastStudyDate: new Date(),
            updatedAt: new Date(),
          };
          this.streaks.set(existing.id, updated);
        }
      } else {
        // If lastStudyDate is null, treat it as the start of a new streak
        const updated: Streak = {
          ...existing,
          currentStreak: 1,
          longestStreak: Math.max(1, existing.longestStreak),
          lastStudyDate: new Date(),
          updatedAt: new Date(),
        };
        this.streaks.set(existing.id, updated);
      }
    }
  }

  // Placeholder for Group Message methods, assuming GroupMessage and InsertGroupMessage types exist
  async getGroupMessages(groupId: string): Promise<any[]> { // Replace 'any[]' with actual GroupMessage[] type
    return Array.from(this.groupMessages.values())
      .filter((msg) => msg.groupId === groupId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sendGroupMessage(data: any): Promise<any> { // Replace 'any' with InsertGroupMessage and GroupMessage types
    const id = randomUUID();
    const message = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.groupMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();