import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  points: integer("points").notNull().default(0),
  rank: integer("rank"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  points: true,
  rank: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Stats table - tracks detailed user statistics
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  currentRank: integer("current_rank"),
  gamesPlayed: integer("games_played").notNull().default(0),
  studySessions: integer("study_sessions").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  totalPoints: true,
  currentRank: true,
  gamesPlayed: true,
  studySessions: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Achievement Definitions table - defines all available achievements
export const achievementDefinitions = pgTable("achievement_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  pointsRequired: integer("points_required").notNull(),
  category: text("category").notNull(),
});

export const insertAchievementDefinitionSchema = createInsertSchema(achievementDefinitions).omit({
  id: true,
});

export type InsertAchievementDefinition = z.infer<typeof insertAchievementDefinitionSchema>;
export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;

// User Achievements table - junction table for earned achievements
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievementDefinitions.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Games table
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  pointsReward: integer("points_reward").notNull(),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  instructions: text("instructions").notNull(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// Study Materials table
export const studyMaterials = pgTable("study_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  difficulty: text("difficulty").notNull(),
  content: text("content").notNull(),
  pointsReward: integer("points_reward").notNull(),
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).omit({
  id: true,
});

export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type StudyMaterial = typeof studyMaterials.$inferSelect;

// User Activities table
export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  activityTitle: text("activity_title").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  timestamp: true,
});

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

// Game Scores table for tracking high scores
export const gameScores = pgTable("game_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
  completedAt: true,
});

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScores.$inferSelect;

// Bookmarks table for study materials
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studyMaterialId: varchar("study_material_id").notNull().references(() => studyMaterials.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// User Progress table - tracks progress on study materials and games
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(), // 'study_material' or 'game'
  itemId: varchar("item_id").notNull(),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  progressPercentage: true,
  completed: true,
  lastAccessedAt: true,
  completedAt: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Study Sessions table - tracks Pomodoro timer sessions
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(), // in minutes
  xpEarned: integer("xp_earned").notNull().default(0),
  ambientSound: text("ambient_sound"), // 'forest', 'rain', 'cafe', 'silence'
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  xpEarned: true,
  completed: true,
  startedAt: true,
  completedAt: true,
});

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// Tasks table - user study goals and tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'study', 'homework', 'reading', 'practice'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high'
  deadline: timestamp("deadline"),
  completed: boolean("completed").notNull().default(false),
  xpReward: integer("xp_reward").notNull().default(10),
  bonusXp: integer("bonus_xp").notNull().default(0), // for early completion
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  completed: true,
  createdAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Streaks table - tracks daily study streaks
export const streaks = pgTable("streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStreakSchema = createInsertSchema(streaks).omit({
  id: true,
  currentStreak: true,
  longestStreak: true,
  updatedAt: true,
});

export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaks.$inferSelect;

// Badges table - defines available badges
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name or emoji
  requirement: text("requirement").notNull(), // e.g., '5-day-streak', 'early-riser', 'focus-master'
  category: text("category").notNull(), // 'streak', 'achievement', 'milestone'
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges table - junction table for earned badges
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Friendships table - tracks friend connections between users
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: varchar("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Groups table - defines study groups
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  avatarUrl: text("avatar_url"),
  isPublic: boolean("is_public").notNull().default(true), // public groups can be discovered and joined
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Group Members table - tracks which users belong to which groups
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default('member'), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

// Group Challenges table - tracks challenges and competitions within groups
export const groupChallenges = pgTable("group_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  challengeType: text("challenge_type").notNull(), // 'points', 'study_sessions', 'games_completed'
  targetValue: integer("target_value").notNull(), // e.g., 1000 points, 10 sessions
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupChallengeSchema = createInsertSchema(groupChallenges).omit({
  id: true,
  createdAt: true,
});

export type InsertGroupChallenge = z.infer<typeof insertGroupChallengeSchema>;
export type GroupChallenge = typeof groupChallenges.$inferSelect;

// Group Messages table - stores chat messages for groups
export const groupMessages = pgTable("group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;
