import {
  type User,
  type InsertUser,
  type Game,
  type InsertGame,
  type Achievement,
  type InsertAchievement,
  type StudyMaterial,
  type InsertStudyMaterial,
  type UserActivity,
  type InsertUserActivity,
  type GameScore,
  type InsertGameScore,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Game methods
  getGame(id: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Achievement methods
  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private achievements: Map<string, Achievement>;
  private studyMaterials: Map<string, StudyMaterial>;
  private userActivities: Map<string, UserActivity>;
  private gameScores: Map<string, GameScore>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.achievements = new Map();
    this.studyMaterials = new Map();
    this.userActivities = new Map();
    this.gameScores = new Map();
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
    await this.updateLeaderboardRanks();
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
    const sortedUsers = await this.getAllUsers();
    sortedUsers.forEach((user, index) => {
      user.rank = index + 1;
      this.users.set(user.id, user);
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

  // Achievement methods
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      unlockedAt: new Date(),
    };
    this.achievements.set(id, achievement);
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
}

export const storage = new MemStorage();
