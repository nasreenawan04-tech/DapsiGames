# Migrating to Supabase Database

This document explains how to migrate the DapsiGames application from Neon database to Supabase.

## Current Setup

The application is currently configured to use Neon serverless Postgres database. This provides:
- Serverless Postgres database
- WebSocket-based real-time updates (custom implementation)
- Drizzle ORM for database operations

## Supabase Setup

Supabase provides additional features that align with the Phase 6 requirements:
- PostgreSQL database
- Built-in authentication
- Real-time subscriptions via Supabase Realtime
- Row Level Security (RLS) policies
- Storage for user avatars and game assets

## Migration Steps

### 1. Database Migration

1. Run the SQL migrations in your Supabase project:
   - Go to Supabase Dashboard > SQL Editor
   - Execute `server/migrations/001_initial_schema.sql`
   - Execute `server/migrations/002_rls_policies.sql`
   - Execute `server/migrations/003_seed_data.sql`

### 2. Environment Variables

Update your environment variables:
```env
DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

### 3. Update Database Connection

Replace `server/db.ts` to use Supabase:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### 4. Implement Supabase Realtime

Update `server/websocket.ts` or create a new `server/supabase-realtime.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export function subscribeToLeaderboard(callback: (payload: any) => void) {
  return supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_stats'
      },
      callback
    )
    .subscribe();
}
```

### 5. Update Frontend to Use Supabase Client

In `client/src/lib/supabase.ts`, ensure the client is properly configured:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 6. Enable Real-time in Supabase

In your Supabase project:
1. Go to Database > Replication
2. Enable replication for the `user_stats` table
3. This allows real-time subscriptions to table changes

## Benefits of Supabase Migration

1. **Built-in Authentication**: Replace custom auth with Supabase Auth
2. **Real-time Subscriptions**: Database-level real-time updates
3. **Storage**: Built-in file storage for avatars and game assets
4. **Better RLS**: Native Row Level Security integration
5. **Dashboard**: Visual database management and monitoring

## Current Implementation

The current implementation uses:
- Neon database for PostgreSQL
- Custom WebSocket server for real-time updates
- Both approaches work well for Phase 6 requirements

The migration to Supabase is optional but recommended for:
- Teams wanting integrated auth + database + storage
- Projects needing Supabase-specific features
- Better alignment with the original Phase 6 specification
