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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User>;
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
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
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
}

export const storage = new MemStorage();
