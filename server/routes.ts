import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  users,
  games,
  achievements,
  studyMaterials,
  userActivities,
  gameScores,
  insertUserSchema,
  insertGameSchema,
  insertAchievementSchema,
  insertStudyMaterialSchema,
  insertUserActivitySchema,
  insertGameScoreSchema,
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { setupWebSocket, broadcastLeaderboardUpdate } from "./websocket";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  // ===== Authentication Routes =====
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
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

      const { password, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
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

  // Get all users for leaderboard
  app.get("/api/users/leaderboard", async (req, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          points: users.points,
          rank: users.rank,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .orderBy(desc(users.points))
        .limit(100);

      res.json(allUsers);
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

      const [updatedUser] = await db
        .update(users)
        .set({ points })
        .where(eq(users.id, req.params.userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await updateLeaderboardRanks();

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user profile
  app.patch("/api/user/:userId/profile", async (req, res) => {
    try {
      const { fullName, avatarUrl } = req.body;
      
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

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

  // ===== Game Routes =====
  
  // Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const allGames = await db.select().from(games);
      res.json(allGames);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single game
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const [game] = await db
        .select()
        .from(games)
        .where(eq(games.id, req.params.gameId))
        .limit(1);

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

      const [updatedUser] = await db
        .update(users)
        .set({ points: user.points + pointsEarned })
        .where(eq(users.id, userId))
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
        totalPoints: updatedUser.points,
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
  
  // Get all study materials
  app.get("/api/study", async (req, res) => {
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

      const [updatedUser] = await db
        .update(users)
        .set({ points: user.points + material.pointsReward })
        .where(eq(users.id, userId))
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
        totalPoints: updatedUser.points,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Achievement Routes =====
  
  // Get user achievements
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const userAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, req.params.userId))
        .orderBy(desc(achievements.unlockedAt));

      res.json(userAchievements);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create achievement
  app.post("/api/achievements", async (req, res) => {
    try {
      const validatedData = insertAchievementSchema.parse(req.body);

      const [achievement] = await db
        .insert(achievements)
        .values(validatedData)
        .returning();

      res.json(achievement);
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

  // Helper function to update leaderboard ranks
  async function updateLeaderboardRanks() {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.points));

    for (let i = 0; i < allUsers.length; i++) {
      await db
        .update(users)
        .set({ rank: i + 1 })
        .where(eq(users.id, allUsers[i].id));
    }
  }

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

      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
