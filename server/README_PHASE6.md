# Phase 6 Implementation Guide: Database Design and Core Data Management

## Overview

Phase 6 has been implemented with a comprehensive database schema, API routes, and real-time functionality for the DapsiGames platform.

## What's Implemented

### 1. Database Schema (shared/schema.ts)
✅ **New Tables Added:**
- `user_stats` - Tracks detailed user statistics (points, rank, games played, study sessions)
- `achievement_definitions` - Defines all available achievements
- `user_achievements` - Junction table for earned achievements
- `user_progress` - Tracks progress on study materials and games

✅ **Existing Tables Updated:**
- All tables maintained with proper relationships and constraints

### 2. SQL Migrations (server/migrations/)
✅ Created three migration files:
- `001_initial_schema.sql` - Creates all tables with indexes
- `002_rls_policies.sql` - Implements Row Level Security
- `003_seed_data.sql` - Adds sample games, study materials, and achievements

### 3. API Routes (server/routes.ts)
✅ **New Endpoints:**
- `GET /api/leaderboard` - Get leaderboard with user stats
- `GET /api/stats/:userId` - Get user statistics
- `PATCH /api/stats/:userId` - Update user statistics
- `GET /api/achievements/definitions` - Get all achievement definitions
- `GET /api/achievements/:userId` - Get user's earned achievements
- `POST /api/achievements/unlock` - Unlock achievement for user
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress` - Create/update progress

✅ **Updated Endpoints:**
- Point tracking now updates both `users.points` and `user_stats.total_points`
- Game completion tracks games played counter
- Study completion tracks study sessions counter
- Leaderboard ranks auto-update on point changes

### 4. Real-time Functionality
✅ **WebSocket Implementation (server/websocket.ts):**
- Enhanced WebSocket server with multiple broadcast functions
- `broadcastLeaderboardUpdate()` - Notifies clients of leaderboard changes
- `broadcastLeaderboardData()` - Sends full leaderboard data
- `broadcastUserAchievement()` - Notifies achievement unlocks
- `broadcastPointsEarned()` - Notifies point awards

✅ **Supabase Realtime Hook (client/src/hooks/use-realtime-leaderboard.ts):**
- React hook for subscribing to leaderboard changes via Supabase Realtime
- Automatically refetches data when `user_stats` table changes
- Ready to use once Supabase database is connected

## Setup Instructions

### Option A: Using Current Setup (Neon + WebSocket)

The application currently works with:
- Neon serverless Postgres database
- Custom WebSocket server for real-time updates
- All Phase 6 functionality is operational

**No additional setup required** - the app works as-is.

### Option B: Migrating to Supabase (Recommended per Spec)

To align with the Phase 6 specification requirement for "Supabase Realtime":

1. **Update Database Connection:**
   ```env
   # Replace your current DATABASE_URL with your Supabase connection string
   DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
   ```

2. **Run Migrations in Supabase:**
   - Go to Supabase Dashboard > SQL Editor
   - Execute `server/migrations/001_initial_schema.sql`
   - Execute `server/migrations/002_rls_policies.sql`
   - Execute `server/migrations/003_seed_data.sql`

3. **Enable Realtime in Supabase:**
   - Go to Database > Replication in Supabase Dashboard
   - Enable replication for the `user_stats` table
   - This allows real-time subscriptions to work

4. **Update Frontend to Use Supabase Realtime:**
   ```typescript
   // In your leaderboard page component
   import { useRealtimeLeaderboard } from '@/hooks/use-realtime-leaderboard';
   
   function LeaderboardPage() {
     const { leaderboard, isLoading, error } = useRealtimeLeaderboard();
     // Use the leaderboard data - it updates automatically!
   }
   ```

## Testing

### Test Database Operations:
```bash
# Seed the database with sample data
curl -X POST http://localhost:5000/api/seed

# Get leaderboard
curl http://localhost:5000/api/leaderboard

# Get user stats
curl http://localhost:5000/api/stats/[userId]
```

### Test Real-time Updates (WebSocket):
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = (event) => {
  console.log('Real-time update:', JSON.parse(event.data));
};
```

### Test Real-time Updates (Supabase):
Use the `useRealtimeLeaderboard` hook in any React component - it automatically subscribes to updates!

## Architecture Notes

### Point Tracking System
All point-earning activities now update TWO places:
1. `users.points` - Legacy support for backward compatibility
2. `user_stats.total_points` - Source of truth for leaderboard

The leaderboard ALWAYS reads from `user_stats` to ensure consistency.

### Leaderboard Ranking
Rankings are automatically recalculated whenever points change:
- Sorted by `total_points` descending
- Ranks assigned sequentially (1, 2, 3, ...)
- WebSocket/Realtime updates notify all connected clients

### Achievement System
Two-table design:
- `achievement_definitions` - Reusable achievement templates
- `user_achievements` - Records of who earned what and when

This allows:
- Easy management of achievement criteria
- Efficient queries for user achievements
- Prevents duplicate achievement unlocks

## File Structure

```
server/
├── migrations/
│   ├── 001_initial_schema.sql      # Database tables
│   ├── 002_rls_policies.sql        # Security policies
│   ├── 003_seed_data.sql           # Sample data
│   └── README.md                   # Migration instructions
├── db.ts                           # Database connection
├── routes.ts                       # API endpoints
├── storage.ts                      # Storage interface (for in-memory fallback)
├── websocket.ts                    # Real-time WebSocket server
└── SUPABASE_MIGRATION.md           # Supabase migration guide

client/src/
├── hooks/
│   └── use-realtime-leaderboard.ts # Supabase Realtime hook
└── lib/
    └── supabase.ts                 # Supabase client config

shared/
└── schema.ts                       # TypeScript types & Drizzle schema
```

## Next Steps

1. ✅ Phase 6 core functionality complete
2. ⚠️ Choose database backend (Neon or Supabase)
3. 📝 Run migrations in chosen database
4. 🧪 Test all endpoints and real-time features
5. 🚀 Ready for Phase 7: Advanced features and optimizations

## Known Considerations

- **Database Choice**: Project currently uses Neon, but Supabase is specified in requirements
- **Realtime Implementation**: WebSocket works now, Supabase Realtime hook is ready when database migrates
- **Migration Path**: See `server/SUPABASE_MIGRATION.md` for detailed migration guide
- **RLS Policies**: Configured but only enforced when using Supabase Auth + Supabase Database together

## Support

For issues or questions about Phase 6 implementation, check:
1. This README for architecture overview
2. `server/SUPABASE_MIGRATION.md` for Supabase-specific setup
3. SQL migration files for database schema details
