
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  if (!db) {
    console.log("Skipping database initialization - using in-memory storage");
    return;
  }

  try {
    // Create tables in correct order (respecting foreign key dependencies)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        full_name VARCHAR NOT NULL,
        points INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 0,
        avatar_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR,
        subscription_status VARCHAR,
        is_pro BOOLEAN DEFAULT false
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_points INTEGER DEFAULT 0,
        current_rank INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        study_sessions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_study_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activities (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR NOT NULL,
        activity_title VARCHAR NOT NULL,
        points_earned INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        duration INTEGER NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        ambient_sound TEXT,
        completed BOOLEAN DEFAULT false,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        category VARCHAR NOT NULL,
        priority VARCHAR NOT NULL,
        deadline TIMESTAMP,
        completed BOOLEAN DEFAULT false,
        xp_reward INTEGER DEFAULT 10,
        bonus_xp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        avatar_url VARCHAR,
        is_public BOOLEAN DEFAULT true,
        owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS group_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS levels (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        level_number INTEGER UNIQUE NOT NULL,
        xp_required INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        badge_icon VARCHAR
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        icon VARCHAR,
        category VARCHAR,
        xp_requirement INTEGER DEFAULT 0
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS achievement_definitions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        badge_icon VARCHAR,
        points_required INTEGER DEFAULT 0,
        category VARCHAR
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS study_materials (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT,
        subject VARCHAR NOT NULL,
        difficulty VARCHAR,
        content TEXT,
        points_reward INTEGER DEFAULT 0
      )
    `);

    console.log("✓ Database tables initialized successfully");
  } catch (error: any) {
    console.error("Database initialization error:", error.message);
  }
}
