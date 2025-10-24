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
  friendships,
  groups,
  groupMembers,
  groupChallenges,
  groupMessages,
  shopItems,
  userInventory,
  userCoins,
  levels,
  userLevels,
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
  insertFriendshipSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertGroupChallengeSchema,
  insertGroupMessageSchema,
  insertShopItemSchema,
  insertUserInventorySchema,
  insertUserCoinsSchema,
  insertLevelSchema,
  insertUserLevelSchema,
} from "@shared/schema";
import {
  calculateStudySessionXP,
  calculateTaskCompletionXP,
  awardXP,
  awardCoins,
  spendCoins,
  updateStreak,
  checkAndAwardAchievements,
  initializeLevels,
  initializeBadges,
  getLevelFromXP,
  broadcastPointsEarned,
} from "./services/gamification";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setupWebSocket, broadcastLeaderboardUpdate, wss } from "./websocket";
import { healthCheck } from "./middleware/health";
import { cacheMiddleware } from "./middleware/cache";
import { validateRegistration, validateLogin } from "./middleware/validation";
import { requireAuth, optionalAuth, type AuthRequest } from "./middleware/auth";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Only setup WebSocket if not running on Vercel (serverless doesn't support WebSockets)
  if (!process.env.VERCEL) {
    setupWebSocket(httpServer);
    console.log('WebSocket server initialized');
  } else {
    console.log('Running on Vercel - WebSocket disabled');
  }

  app.get("/api/health", healthCheck);
  // ===== Authentication Routes =====

  // Register new user
  app.post("/api/auth/register", validateRegistration, async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(validatedData.email);

      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Initialize user stats and streak
      if (db) {
        try {
          // Check if stats already exist
          const existingStats = await db
            .select()
            .from(userStats)
            .where(eq(userStats.userId, newUser.id))
            .limit(1);

          if (existingStats.length === 0) {
            await db.insert(userStats).values({
              userId: newUser.id,
              totalPoints: 0,
              currentRank: 0,
              gamesPlayed: 0,
              studySessions: 0,
            });
          }

          // Check if streak already exists
          const existingStreak = await db
            .select()
            .from(streaks)
            .where(eq(streaks.userId, newUser.id))
            .limit(1);

          if (existingStreak.length === 0) {
            await db.insert(streaks).values({
              userId: newUser.id,
              currentStreak: 0,
              longestStreak: 0,
            });
          }

          // Initialize user coins
          const existingCoins = await db
            .select()
            .from(userCoins)
            .where(eq(userCoins.userId, newUser.id))
            .limit(1);

          if (existingCoins.length === 0) {
            await db.insert(userCoins).values({
              userId: newUser.id,
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
            });
          }

          // Initialize user level
          const existingLevel = await db
            .select()
            .from(userLevels)
            .where(eq(userLevels.userId, newUser.id))
            .limit(1);

          if (existingLevel.length === 0) {
            await db.insert(userLevels).values({
              userId: newUser.id,
              currentLevel: 1,
              currentXp: 0,
              totalXp: 0,
            });
          }
        } catch (error: any) {
          console.error("Error initializing user data:", error.message);
        }
      }

      const { password, ...userWithoutPassword } = newUser;
      
      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session creation failed" });
        }
        
        // Store user ID in new session
        req.session.userId = newUser.id;
        
        // Save session before responding
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session save failed" });
          }
          res.json(userWithoutPassword);
        });
      });
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

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session creation failed" });
        }
        
        // Store user ID in new session
        req.session.userId = user.id;
        
        // Save session before responding
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session save failed" });
          }
          
          const { password: _, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Logout user
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get current authenticated user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
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
      const user = await storage.getUser(req.params.userId);

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
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

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

  // ===== Friend System Routes =====

  // Send friend request
  app.post("/api/friends/request", async (req, res, next) => {
    try {
      const { userId, friendId } = req.body;

      if (!userId || !friendId) {
        return res.status(400).send({ message: "userId and friendId are required" });
      }

      if (userId === friendId) {
        return res.status(400).send({ message: "Cannot send friend request to yourself" });
      }

      // Check if users exist
      const user = await storage.getUserById(userId);
      const friend = await storage.getUserById(friendId);

      if (!user || !friend) {
        return res.status(404).send({ message: "User not found" });
      }

      // Check if friendship already exists
      const existing = await storage.checkFriendship(userId, friendId);
      if (existing) {
        return res.status(400).send({ message: "Friend request already exists" });
      }

      const friendship = await storage.createFriendRequest(userId, friendId);

      // Create notification activity for the friend
      await storage.createActivity({
        userId: friendId,
        activityType: "friend_request",
        title: `${user.fullName} sent you a friend request`,
        points: 0,
      });

      res.json(friendship);
    } catch (error) {
      next(error);
    }
  });

  // Accept friend request
  app.patch("/api/friends/:friendshipId/accept", async (req, res) => {
    try {
      const { friendshipId } = req.params;

      const updated = await storage.updateFriendship(friendshipId, { 
        status: 'accepted', 
        updatedAt: new Date() 
      });

      if (!updated) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Reject friend request
  app.patch("/api/friends/:friendshipId/reject", async (req, res) => {
    try {
      const { friendshipId } = req.params;

      const updated = await storage.updateFriendship(friendshipId, { 
        status: 'rejected', 
        updatedAt: new Date() 
      });

      if (!updated) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Remove friend
  app.delete("/api/friends/:friendshipId", async (req, res) => {
    try {
      const { friendshipId } = req.params;

      await storage.deleteFriendship(friendshipId);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's friends (accepted friendships)
  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const friendships = await storage.getUserFriendships(userId);
      const acceptedFriendships = friendships.filter(f => f.status === 'accepted');

      const userFriends = await Promise.all(acceptedFriendships.map(async (friendship) => {
        const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
        const friendUser = await storage.getUser(friendId);

        if (!friendUser) return null;

        return {
          friendshipId: friendship.id,
          userId: friendUser.id,
          fullName: friendUser.fullName,
          email: friendUser.email,
          points: friendUser.points,
          rank: friendUser.rank,
          avatarUrl: friendUser.avatarUrl,
          status: friendship.status,
          createdAt: friendship.createdAt,
        };
      }));

      res.json(userFriends.filter(f => f !== null));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get pending friend requests for a user
  app.get("/api/friends/:userId/requests", async (req, res) => {
    try {
      const { userId } = req.params;

      const friendships = await storage.getUserFriendships(userId);
      const pendingRequests = friendships.filter(f => f.friendId === userId && f.status === 'pending');

      const requests = await Promise.all(pendingRequests.map(async (friendship) => {
        const requesterUser = await storage.getUser(friendship.userId);

        if (!requesterUser) return null;

        return {
          friendshipId: friendship.id,
          userId: requesterUser.id,
          fullName: requesterUser.fullName,
          email: requesterUser.email,
          avatarUrl: requesterUser.avatarUrl,
          createdAt: friendship.createdAt,
        };
      }));

      res.json(requests.filter(r => r !== null));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Search users (for adding friends)
  app.get("/api/users/search", async (req, res) => {
    try {
      const { query, userId } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json([]);
      }

      const allUsers = await storage.getAllUsers();
      const lowerQuery = query.toLowerCase();

      // Exclude the current user from search results
      const searchResults = allUsers
        .filter(user => {
          const matchesQuery = user.fullName.toLowerCase().includes(lowerQuery) || 
            user.email.toLowerCase().includes(lowerQuery);
          const notCurrentUser = userId ? user.id !== userId : true;
          return matchesQuery && notCurrentUser;
        })
        .slice(0, 10)
        .map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          points: user.points,
          rank: user.rank,
          avatarUrl: user.avatarUrl,
        }));

      res.json(searchResults);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Social Groups Routes =====

  // Create a new group
  app.post("/api/groups", async (req, res, next) => {
    try {
      const { name, description, isPublic, ownerId } = req.body;

      if (!name || !ownerId) {
        return res.status(400).send({ message: "name and ownerId are required" });
      }

      if (name.trim().length < 3) {
        return res.status(400).send({ message: "Group name must be at least 3 characters long" });
      }

      // Validate owner exists
      const owner = await storage.getUserById(ownerId);
      if (!owner) {
        return res.status(404).send({ message: "Owner user not found" });
      }

      const group = await storage.createGroup({
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic ?? true,
        ownerId,
      });

      // Automatically add owner as a member with 'owner' role
      await storage.joinGroup(group.id, ownerId);
      await db.update(groupMembers)
        .set({ role: 'owner' })
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.userId, ownerId)
        ));

      // Create activity
      await storage.createActivity({
        userId: ownerId,
        activityType: "group_created",
        title: `Created group: ${group.name}`,
        points: 50,
      });

      // Update user XP for creating group
      await storage.updateUserPoints(ownerId, owner.totalXp + 50);

      res.json(group);
    } catch (error) {
      next(error);
    }
  });

  // Get all public groups
  app.get("/api/groups", async (req, res) => {
    try {
      const allGroups = await storage.getAllGroups();
      const publicGroups = allGroups.filter(g => g.isPublic);

      const enrichedGroups = await Promise.all(publicGroups.map(async (group) => {
        const owner = await storage.getUser(group.ownerId);
        const members = await storage.getGroupMembers(group.id);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          avatarUrl: group.avatarUrl,
          isPublic: group.isPublic,
          ownerId: group.ownerId,
          ownerName: owner?.fullName || 'Unknown',
          createdAt: group.createdAt,
          memberCount: members.length,
        };
      }));

      res.json(enrichedGroups);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's groups
  app.get("/api/groups/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const userGroups = await storage.getUserGroups(userId);

      if (userGroups.length === 0) {
        return res.json([]);
      }

      const result = await Promise.all(userGroups.map(async (group) => {
        const members = await storage.getGroupMembers(group.id);
        const allMembers = await storage.getGroupMembers(group.id);
        const userMembership = allMembers.find(m => m.userId === userId);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          avatarUrl: group.avatarUrl,
          isPublic: group.isPublic,
          ownerId: group.ownerId,
          memberCount: members.length,
          role: userMembership?.role,
          joinedAt: userMembership?.joinedAt,
        };
      }));

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group details
  app.get("/api/groups/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;

      const group = await storage.getGroup(groupId);

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Join a group
  app.post("/api/groups/:groupId/join", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      // Check if user is already a member
      const [existing] = await db
        .select()
        .from(groupMembers)
        .where(sql`${groupMembers.groupId} = ${groupId} AND ${groupMembers.userId} = ${userId}`)
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Already a member of this group" });
      }

      const [membership] = await db
        .insert(groupMembers)
        .values({
          groupId,
          userId,
          role: 'member',
        })
        .returning();

      res.json(membership);
    } catch (error: any) {
      console.error("Error joining group:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Leave a group
  app.post("/api/groups/:groupId/leave", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      await storage.deleteGroupMember(groupId, userId);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group members
  app.get("/api/groups/:groupId/members", async (req, res) => {
    try {
      const { groupId } = req.params;

      const groupMembers = await storage.getGroupMembers(groupId);

      const members = await Promise.all(groupMembers.map(async (member) => {
        const user = await storage.getUser(member.userId);

        if (!user) return null;

        return {
          membershipId: member.id,
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          points: user.points,
          rank: user.rank,
          role: member.role,
          joinedAt: member.joinedAt,
        };
      }));

      const enrichedMembers = members.filter(m => m !== null);
      enrichedMembers.sort((a, b) => (b?.points || 0) - (a?.points || 0));

      res.json(enrichedMembers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group leaderboard
  app.get("/api/groups/:groupId/leaderboard", async (req, res) => {
    try {
      const { groupId } = req.params;

      const leaderboard = await db
        .select({
          userId: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          points: users.points,
          rank: users.rank,
          gamesPlayed: userStats.gamesPlayed,
          studySessions: userStats.studySessions,
          role: groupMembers.role,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .leftJoin(userStats, eq(users.id, userStats.userId))
        .where(eq(groupMembers.groupId, groupId))
        .orderBy(desc(users.points));

      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group activity feed
  app.get("/api/groups/:groupId/activities", async (req, res) => {
    try {
      const { groupId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await db
        .select({
          activityId: userActivities.id,
          userId: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          activityType: userActivities.activityType,
          activityTitle: userActivities.activityTitle,
          pointsEarned: userActivities.pointsEarned,
          timestamp: userActivities.timestamp,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .innerJoin(userActivities, eq(users.id, userActivities.userId))
        .where(eq(groupMembers.groupId, groupId))
        .orderBy(desc(userActivities.timestamp))
        .limit(limit);

      res.json(activities);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create group challenge
  app.post("/api/groups/:groupId/challenges", async (req, res) => {
    try {
      const { groupId } = req.params;
      const validatedData = insertGroupChallengeSchema.parse({
        ...req.body,
        groupId,
      });

      const [challenge] = await db
        .insert(groupChallenges)
        .values(validatedData)
        .returning();

      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group challenges
  app.get("/api/groups/:groupId/challenges", async (req, res) => {
    try {
      const { groupId } = req.params;

      const challenges = await db
        .select()
        .from(groupChallenges)
        .where(eq(groupChallenges.groupId, groupId))
        .orderBy(desc(groupChallenges.createdAt));

      res.json(challenges);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Send a message to a group
  app.post("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId, message } = req.body;

      if (!userId || !message || !message.trim()) {
        return res.status(400).json({ error: "User ID and message are required" });
      }

      // Verify user is a member of the group
      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(sql`${groupMembers.groupId} = ${groupId} AND ${groupMembers.userId} = ${userId}`)
        .limit(1);

      if (!membership) {
        return res.status(403).json({ error: "You must be a member to send messages" });
      }

      const validatedData = insertGroupMessageSchema.parse({
        groupId,
        userId,
        message: message.trim(),
      });

      const [newMessage] = await db
        .insert(groupMessages)
        .values(validatedData)
        .returning();

      res.json(newMessage);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get messages for a group
  app.get("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const { groupId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await db
        .select({
          id: groupMessages.id,
          groupId: groupMessages.groupId,
          userId: groupMessages.userId,
          message: groupMessages.message,
          createdAt: groupMessages.createdAt,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(groupMessages)
        .innerJoin(users, eq(groupMessages.userId, users.id))
        .where(eq(groupMessages.groupId, groupId))
        .orderBy(desc(groupMessages.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(messages.reverse()); // Reverse to show oldest first
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

  // Get all activities (for leaderboard time filtering)
  app.get("/api/activities/all", async (req, res) => {
    try {
      const activities = await db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          activityType: userActivities.activityType,
          activityTitle: userActivities.activityTitle,
          pointsEarned: userActivities.pointsEarned,
          timestamp: userActivities.timestamp,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(userActivities)
        .innerJoin(users, eq(userActivities.userId, users.id))
        .orderBy(desc(userActivities.timestamp))
        .limit(1000);

      res.json(activities);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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

  // Get study sessions for a user
  app.get("/api/study-sessions/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      const sessions = await storage.getUserStudySessions(req.params.userId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching study sessions:", error);
      res.status(500).send({ error: error.message });
    }
  });

  app.post("/api/study-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      const { userId, duration, ambientSound } = req.body;

      if (!userId || !duration) {
        return res.status(400).send({ error: "Missing required fields" });
      }

      const session = await storage.createStudySession({
        userId,
        duration,
        ambientSound: ambientSound || "silence",
      });

      res.json(session);
    } catch (error: any) {
      console.error("Error creating study session:", error);
      res.status(500).send({ error: error.message });
    }
  });

  app.patch("/api/study-sessions/:id/complete", async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.completeStudySession(sessionId);

      if (!session) {
        return res.status(404).send({ message: "Session not found" });
      }

      // Update user XP
      const user = await storage.getUserById(session.userId);
      if (user) {
        const newTotalXp = user.totalXp + session.xpEarned;
        await storage.updateUserPoints(session.userId, newTotalXp);

        // Check for level up
        const newLevel = Math.floor(newTotalXp / 1000) + 1;
        if (newLevel > user.level) {
          await db.update(users)
            .set({ level: newLevel })
            .where(eq(users.id, session.userId));
        }
      }

      // Update streak
      await updateStreak(session.userId);

      // Record activity
      await storage.createActivity({
        userId: session.userId,
        activityType: "study_session",
        title: `Completed ${session.duration} minute study session`,
        points: session.xpEarned,
      });

      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: "study_session_completed",
            userId: session.userId,
            xpEarned: session.xpEarned,
          }));
        }
      });

      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  // ===== Tasks Routes =====

  // Get tasks for a user
  app.get("/api/tasks/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      const tasks = await storage.getUserTasks(req.params.userId);
      res.json(tasks);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      res.status(500).send({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res, next) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);

      // Validate user exists
      const user = await storage.getUserById(taskData.userId);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // Calculate XP rewards based on priority
      const xpReward = taskData.priority === "high" ? 30 : taskData.priority === "medium" ? 20 : 10;
      const bonusXp = taskData.deadline ? 10 : 0;

      const task = await storage.createTask({
        ...taskData,
        xpReward,
        bonusXp,
      });

      // Create activity
      await storage.createActivity({
        userId: taskData.userId,
        activityType: "task_created",
        title: `Created task: ${taskData.title}`,
        points: 0,
      });

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      const { title, description, category, priority, deadline } = req.body;
      const task = await storage.updateTask(req.params.taskId, {
        title,
        description,
        category,
        priority,
        deadline: deadline ? new Date(deadline) : null,
      });

      if (!task) {
        return res.status(404).send({ error: "Task not found" });
      }

      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(500).send({ error: error.message });
    }
  });

  app.patch("/api/tasks/:taskId/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      const task = await storage.completeTask(req.params.taskId);

      if (!task) {
        return res.status(404).send({ error: "Task not found" });
      }

      // Calculate XP with bonus for early completion
      let xpEarned = task.xpReward;
      if (task.deadline && new Date() < new Date(task.deadline)) {
        xpEarned += task.bonusXp;
      }

      // Update user XP
      await storage.addUserPoints(task.userId, xpEarned);

      // Broadcast points update
      broadcastPointsEarned(task.userId, xpEarned, `Completed task: ${task.title}`);

      res.json({ ...task, xpEarned });
    } catch (error: any) {
      console.error("Error completing task:", error);
      res.status(500).send({ error: error.message });
    }
  });

  app.delete("/api/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    try {
      await storage.deleteTask(req.params.taskId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting task:", error);
      res.status(500).send({ error: error.message });
    }
  });

  // ===== Streaks Routes =====

  // Get streak for a user
  app.get("/api/streaks/:userId", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const [userStreak] = await db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, req.params.userId))
        .limit(1);

      if (!userStreak) {
        // Create a new streak for the user
        try {
          const [newStreak] = await db
            .insert(streaks)
            .values({ 
              userId: req.params.userId,
              currentStreak: 0,
              longestStreak: 0,
            })
            .returning();

          return res.json(newStreak);
        } catch (insertError: any) {
          // If insert fails, try to select again (race condition)
          const [existingStreak] = await db
            .select()
            .from(streaks)
            .where(eq(streaks.userId, req.params.userId))
            .limit(1);

          if (existingStreak) {
            return res.json(existingStreak);
          }

          throw insertError;
        }
      }

      res.json(userStreak);
    } catch (error: any) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ error: error.message });
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

  // ===== PHASE 6: Gamification Backend & Advanced Features =====

  // Initialize levels and badges on server start
  initializeLevels().catch((error) => {
    console.error("Failed to initialize levels:", error.message);
  });
  initializeBadges().catch((error) => {
    console.error("Failed to initialize badges:", error.message);
  });

  // ==== XP & Level System Routes ====

  // Get user level info
  app.get("/api/users/:userId/level", async (req, res) => {
    try {
      const [userLevel] = await db
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, req.params.userId))
        .limit(1);

      if (!userLevel) {
        return res.status(404).json({ error: "User level not found" });
      }

      const levelInfo = await getLevelFromXP(userLevel.totalXp);

      res.json({
        ...userLevel,
        ...levelInfo,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Award XP to user (used after completing sessions, tasks, games)
  app.post("/api/users/:userId/xp", async (req, res) => {
    try {
      const { amount, reason } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid XP amount" });
      }

      const result = await awardXP(req.params.userId, amount);

      // Check for new achievements
      const newBadges = await checkAndAwardAchievements(req.params.userId);

      // Update streak
      const streakResult = await updateStreak(req.params.userId);

      // Broadcast leaderboard update
      broadcastLeaderboardUpdate();

      res.json({
        ...result,
        newBadges,
        streak: streakResult,
        reason: reason || "XP awarded",
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all levels
  app.get("/api/levels", async (req, res) => {
    try {
      const levelList = await db
        .select()
        .from(levels)
        .orderBy(levels.levelNumber);

      res.json(levelList);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Coins System Routes ====

  // Get user coins
  app.get("/api/users/:userId/coins", async (req, res) => {
    try {
      const [coins] = await db
        .select()
        .from(userCoins)
        .where(eq(userCoins.userId, req.params.userId))
        .limit(1);

      if (!coins) {
        // Create default coins record
        const [newCoins] = await db
          .insert(userCoins)
          .values({ userId: req.params.userId })
          .returning();

        return res.json(newCoins);
      }

      res.json(coins);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Award coins (manual or system)
  app.post("/api/users/:userId/coins/award", async (req, res) => {
    try {
      const { amount, reason } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid coin amount" });
      }

      const result = await awardCoins(req.params.userId, amount, reason || "Coins awarded");

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Streak System Routes ====

  // Get user streak
  app.get("/api/users/:userId/streak", async (req, res) => {
    try {
      const [streak] = await db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, req.params.userId))
        .limit(1);

      if (!streak) {
        // Create default streak record
        const [newStreak] = await db
          .insert(streaks)
          .values({ userId: req.params.userId })
          .returning();

        return res.json(newStreak);
      }

      res.json(streak);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update streak (called after study session)
  app.post("/api/users/:userId/streak/update", async (req, res) => {
    try {
      const result = await updateStreak(req.params.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Badge System Routes ====

  // Get all badges (definitions)
  app.get("/api/badges", async (req, res) => {
    try {
      const allBadges = await db.select().from(badges);
      res.json(allBadges);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const userBadgesList = await db
        .select({
          id: userBadges.id,
          earnedAt: userBadges.earnedAt,
          badge: badges,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, req.params.userId));

      res.json(userBadgesList);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Friend System Routes ====

  // Get user friends
  app.get("/api/users/:userId/friends", async (req, res) => {
    try {
      const friendsList = await db
        .select({ friendId: friendships.friendId })
        .from(friendships)
        .where(eq(friendships.userId, req.params.userId));

      const friendsData = await Promise.all(friendsList.map(async (f: any) => {
        const friend = await storage.getUser(f.friendId);
        if (!friend) return null;

        const friendship = await storage.getFriendship(req.params.userId, f.friendId);

        return {
          id: friendship?.id,
          friendId: friend.id,
          fullName: friend.fullName,
          avatarUrl: friend.avatarUrl,
          points: friend.points,
          status: friendship?.status,
          createdAt: friendship?.createdAt,
        };
      }));

      return res.json(friendsData.filter(f => f !== null));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Send friend request
  app.post("/api/users/:userId/friends/request", async (req, res) => {
    try {
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ error: "Friend ID required" });
      }

      // Check if friendship already exists
      const [existing] = await db
        .select()
        .from(friendships)
        .where(
          sql`(${friendships.userId} = ${req.params.userId} AND ${friendships.friendId} = ${friendId}) OR (${friendships.userId} = ${friendId} AND ${friendships.friendId} = ${req.params.userId})`
        )
        .limit(1);

      if (existing) {
        return res.status(400).json({ error: "Friendship already exists" });
      }

      // Create friend request
      const [friendship] = await db
        .insert(friendships)
        .values({
          userId: req.params.userId,
          friendId,
          status: "pending",
        })
        .returning();

      res.json(friendship);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Accept/reject friend request
  app.patch("/api/friendships/:friendshipId", async (req, res) => {
    try {
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const [updated] = await db
        .update(friendships)
        .set({ status, updatedAt: new Date() })
        .where(eq(friendships.id, req.params.friendshipId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Friendship not found" });
      }

      // If accepted, create reciprocal friendship
      if (status === "accepted") {
        const [reciprocal] = await db
          .select()
          .from(friendships)
          .where(
            sql`${friendships.userId} = ${updated.friendId} AND ${friendships.friendId} = ${updated.userId}`
          )
          .limit(1);

        if (!reciprocal) {
          await db.insert(friendships).values({
            userId: updated.friendId,
            friendId: updated.userId,
            status: "accepted",
          });
        }
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get friend leaderboard
  app.get("/api/users/:userId/friends/leaderboard", async (req, res) => {
    try {
      // Get accepted friends
      const friendsList = await db
        .select({ friendId: friendships.friendId })
        .from(friendships)
        .where(
          sql`${friendships.userId} = ${req.params.userId} AND ${friendships.status} = 'accepted'`
        );

      const friendIds = friendsList.map((f: any) => f.friendId);
      friendIds.push(req.params.userId); // Include current user

      if (friendIds.length === 0) {
        return res.json([]);
      }

      const leaderboard = await db
        .select({
          userId: userStats.userId,
          totalPoints: userStats.totalPoints,
          currentRank: userStats.currentRank,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(userStats)
        .innerJoin(users, eq(userStats.userId, users.id))
        .where(inArray(userStats.userId, friendIds))
        .orderBy(desc(userStats.totalPoints));

      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Reward Shop Routes ====

  // Get all shop items
  app.get("/api/shop/items", async (req, res) => {
    try {
      const { category } = req.query;

      let query = db.select().from(shopItems).where(eq(shopItems.isActive, true));

      if (category && typeof category === "string") {
        query = db
          .select()
          .from(shopItems)
          .where(
            sql`${shopItems.isActive} = true AND ${shopItems.category} = ${category}`
          );
      }

      const items = await query;
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Purchase shop item
  app.post("/api/users/:userId/shop/purchase", async (req, res) => {
    try {
      const { shopItemId } = req.body;

      if (!shopItemId) {
        return res.status(400).json({ error: "Shop item ID required" });
      }

      // Get shop item
      const [item] = await db
        .select()
        .from(shopItems)
        .where(eq(shopItems.id, shopItemId))
        .limit(1);

      if (!item || !item.isActive) {
        return res.status(404).json({ error: "Item not found or not available" });
      }

      // Check if already owned
      const [existing] = await db
        .select()
        .from(userInventory)
        .where(
          sql`${userInventory.userId} = ${req.params.userId} AND ${userInventory.shopItemId} = ${shopItemId}`
        )
        .limit(1);

      if (existing) {
        return res.status(400).json({ error: "Item already owned" });
      }

      // Spend coins
      const spendResult = await spendCoins(req.params.userId, item.coinCost);

      if (!spendResult.success) {
        return res.status(400).json({ error: spendResult.error });
      }

      // Add to inventory
      const [inventoryItem] = await db
        .insert(userInventory)
        .values({
          userId: req.params.userId,
          shopItemId,
        })
        .returning();

      res.json({
        inventoryItem,
        newBalance: spendResult.newBalance,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user inventory
  app.get("/api/users/:userId/inventory", async (req, res) => {
    try {
      const inventory = await db
        .select({
          id: userInventory.id,
          isEquipped: userInventory.isEquipped,
          purchasedAt: userInventory.purchasedAt,
          item: shopItems,
        })
        .from(userInventory)
        .innerJoin(shopItems, eq(userInventory.shopItemId, shopItems.id))
        .where(eq(userInventory.userId, req.params.userId));

      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Equip/unequip inventory item
  app.patch("/api/users/:userId/inventory/:itemId/equip", async (req, res) => {
    try {
      const { isEquipped } = req.body;

      if (typeof isEquipped !== "boolean") {
        return res.status(400).json({ error: "isEquipped must be boolean" });
      }

      // If equipping, unequip other items of the same category
      if (isEquipped) {
        const [item] = await db
          .select({
            category: shopItems.category,
          })
          .from(userInventory)
          .innerJoin(shopItems, eq(userInventory.shopItemId, shopItems.id))
          .where(eq(userInventory.id, req.params.itemId))
          .limit(1);

        if (item) {
          // Unequip all items of same category
          await db
            .update(userInventory)
            .set({ isEquipped: false })
            .where(
              sql`${userInventory.userId} = ${req.params.userId} AND ${userInventory.shopItemId} IN (SELECT id FROM ${shopItems} WHERE ${shopItems.category} = ${item.category})`
            );
        }
      }

      // Update the item
      const [updated] = await db
        .update(userInventory)
        .set({ isEquipped })
        .where(eq(userInventory.id, req.params.itemId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==== Group Leaderboards & Competitions ====

  // Get group leaderboard
  app.get("/api/groups/:groupId/leaderboard", async (req, res) => {
    try {
      const membersList = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, req.params.groupId));

      const memberIds = membersList.map((m: any) => m.userId);

      if (memberIds.length === 0) {
        return res.json([]);
      }

      const leaderboard = await db
        .select({
          userId: userStats.userId,
          totalPoints: userStats.totalPoints,
          currentRank: userStats.currentRank,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          role: groupMembers.role,
        })
        .from(userStats)
        .innerJoin(users, eq(userStats.userId, users.id))
        .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
        .where(
          sql`${groupMembers.groupId} = ${req.params.groupId} AND ${inArray(userStats.userId, memberIds)}`
        )
        .orderBy(desc(userStats.totalPoints));

      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get group challenge progress
  app.get("/api/groups/:groupId/challenges/:challengeId/progress", async (req, res) => {
    try {
      const [challenge] = await db
        .select()
        .from(groupChallenges)
        .where(eq(groupChallenges.id, req.params.challengeId))
        .limit(1);

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Get all members
      const membersList = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, req.params.groupId));

      const memberIds = membersList.map((m: any) => m.userId);

      // Calculate progress based on challenge type
      let progress: any[] = [];

      if (challenge.challengeType === "points") {
        progress = await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
            value: userStats.totalPoints,
          })
          .from(users)
          .innerJoin(userStats, eq(userStats.userId, users.id))
          .where(inArray(users.id, memberIds))
          .orderBy(desc(userStats.totalPoints));
      } else if (challenge.challengeType === "study_sessions") {
        progress = await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
            value: userStats.studySessions,
          })
          .from(users)
          .innerJoin(userStats, eq(userStats.userId, users.id))
          .where(inArray(users.id, memberIds))
          .orderBy(desc(userStats.studySessions));
      } else if (challenge.challengeType === "games_completed") {
        progress = await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
            value: userStats.gamesPlayed,
          })
          .from(users)
          .innerJoin(userStats, eq(userStats.userId, users.id))
          .where(inArray(users.id, memberIds))
          .orderBy(desc(userStats.gamesPlayed));
      }

      res.json({
        challenge,
        progress,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== Stripe Payment & Subscription Routes =====
  // Referenced from blueprint:javascript_stripe

  // Create payment intent for one-time payments
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ 
          error: "Payment service not configured. Please add STRIPE_SECRET_KEY to environment variables." 
        });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-09-30.clover",
      });

      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Get or create subscription for Pro membership
  app.post("/api/get-or-create-subscription", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ 
          error: "Payment service not configured. Please add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to environment variables." 
        });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-09-30.clover",
      });

      // Get authenticated user from request
      const userId = req.userId!;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user already has a subscription, return existing
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        const latestInvoice = typeof subscription.latest_invoice === 'string'
          ? await stripe.invoices.retrieve(subscription.latest_invoice)
          : subscription.latest_invoice;

        let paymentIntent: any = null;
        if (latestInvoice) {
          const invoice = latestInvoice as any;
          paymentIntent = typeof invoice.payment_intent === 'string'
            ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
            : invoice.payment_intent;
        }

        return res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent?.client_secret,
        });
      }

      // Create new customer if needed
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName,
        });
        customerId = customer.id;

        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      if (!process.env.STRIPE_PRICE_ID) {
        return res.status(503).json({ 
          error: "Subscription price not configured. Please add STRIPE_PRICE_ID to environment variables." 
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: process.env.STRIPE_PRICE_ID }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await db
        .update(users)
        .set({ 
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.id, user.id));

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Webhook handler for Stripe events
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ error: "Stripe webhook not configured" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-09-30.clover",
      });

      const sig = req.headers['stripe-signature'] as string;
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as any;
          await db
            .update(users)
            .set({
              subscriptionStatus: subscription.status,
              isPro: subscription.status === 'active',
            })
            .where(eq(users.stripeSubscriptionId, subscription.id));
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}