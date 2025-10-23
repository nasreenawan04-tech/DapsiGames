
import { db } from "./db";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  try {
    console.log("Setting up database...");
    
    // Enable UUID extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create user_stats table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_points INTEGER NOT NULL DEFAULT 0,
        current_rank INTEGER,
        games_played INTEGER NOT NULL DEFAULT 0,
        study_sessions INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create streaks table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_study_date TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create user_activities table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        activity_title TEXT NOT NULL,
        points_earned INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create achievement_definitions table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS achievement_definitions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        category TEXT NOT NULL
      )
    `);
    
    // Create group_members table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);
    
    console.log("Database setup completed!");
  } catch (error: any) {
    console.error("Database setup error:", error.message);
  }
}

setupDatabase();
