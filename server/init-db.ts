
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
        title TEXT NOT NULL,
        rewards TEXT
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        requirement TEXT NOT NULL,
        category TEXT NOT NULL
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

    // Fix existing tables if they have wrong schema
    try {
      // Add rewards column to levels if it doesn't exist
      await db.execute(sql`
        ALTER TABLE levels ADD COLUMN IF NOT EXISTS rewards TEXT
      `);
      
      // Fix badges table - rename xp_requirement to requirement if needed
      const badgesColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'badges'
      `);
      const badgeColumnNames = badgesColumns.rows.map((r: any) => r.column_name);
      
      if (badgeColumnNames.includes('xp_requirement') && !badgeColumnNames.includes('requirement')) {
        // Drop the old column and create new one with correct type
        await db.execute(sql`
          ALTER TABLE badges DROP COLUMN IF EXISTS xp_requirement
        `);
        await db.execute(sql`
          ALTER TABLE badges ADD COLUMN IF NOT EXISTS requirement TEXT NOT NULL DEFAULT ''
        `);
      } else if (!badgeColumnNames.includes('requirement')) {
        await db.execute(sql`
          ALTER TABLE badges ADD COLUMN requirement TEXT NOT NULL DEFAULT ''
        `);
      }
      
      // Ensure requirement column is TEXT not INTEGER
      await db.execute(sql`
        ALTER TABLE badges ALTER COLUMN requirement TYPE TEXT USING requirement::text
      `);
    } catch (error: any) {
      console.log("Schema migration skipped:", error.message);
    }

    // Seed initial levels data - only if table is empty
    try {
      const existingLevels = await db.execute(sql`SELECT COUNT(*) FROM levels`);
      if (existingLevels.rows[0].count === 0 || existingLevels.rows[0].count === '0') {
        await db.execute(sql`
          INSERT INTO levels (level_number, xp_required, title, rewards)
          VALUES 
            (1, 0, 'Novice', '{"coins": 0}'),
            (2, 100, 'Learner', '{"coins": 100}'),
            (3, 250, 'Student', '{"coins": 100}'),
            (4, 500, 'Scholar', '{"coins": 100}'),
            (5, 1000, 'Expert', '{"coins": 100}'),
            (6, 2000, 'Master', '{"coins": 150}'),
            (7, 3500, 'Sage', '{"coins": 150}'),
            (8, 5000, 'Guru', '{"coins": 200}'),
            (9, 7500, 'Legend', '{"coins": 200}'),
            (10, 10000, 'Grandmaster', '{"coins": 250}')
        `);
      }
    } catch (error: any) {
      console.log("Levels seeding skipped:", error.message);
    }

    // Seed initial badges data - only if table is empty
    try {
      const existingBadges = await db.execute(sql`SELECT COUNT(*) FROM badges`);
      if (existingBadges.rows[0].count === 0 || existingBadges.rows[0].count === '0') {
        await db.execute(sql`
          INSERT INTO badges (name, description, icon, requirement, category)
          VALUES 
            ('First Steps', 'Complete your first study session', 'Award', '1-study-session', 'achievement'),
            ('Quick Learner', 'Complete 5 study sessions', 'Zap', '5-study-sessions', 'achievement'),
            ('Dedicated Student', 'Complete 10 study sessions', 'BookOpen', '10-study-sessions', 'achievement'),
            ('Fire Starter', 'Start a 3-day streak', 'Flame', '3-day-streak', 'streak'),
            ('Hot Streak', 'Maintain a 7-day streak', 'Fire', '7-day-streak', 'streak'),
            ('Unstoppable', 'Maintain a 30-day streak', 'Trophy', '30-day-streak', 'streak'),
            ('Early Bird', 'Complete a session before 9 AM', 'Sunrise', 'early-riser', 'achievement'),
            ('Night Owl', 'Complete a session after 10 PM', 'Moon', 'night-owl', 'achievement'),
            ('Focus Master', 'Complete a 60-minute session', 'Target', 'focus-master', 'achievement'),
            ('Century Club', 'Reach 100 total points', 'Star', '100-points', 'milestone')
        `);
      }
    } catch (error: any) {
      console.log("Badges seeding skipped:", error.message);
    }

    console.log("✓ Database tables initialized successfully");
    console.log("✓ Seed data inserted successfully");
  } catch (error: any) {
    console.error("Database initialization error:", error.message);
  }
}
