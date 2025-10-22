# Database Migrations for DapsiGames

This directory contains SQL migration scripts for setting up the Supabase PostgreSQL database.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Go to the SQL Editor section
3. Create a new query
4. Copy and paste the contents of each migration file in order:
   - `001_initial_schema.sql` - Creates all tables and indexes
   - `002_rls_policies.sql` - Sets up Row Level Security policies
   - `003_seed_data.sql` - Inserts initial data for testing

5. Execute each migration by clicking "Run"

### Option 2: Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

## Migration Files

- **001_initial_schema.sql**: Creates all core tables (users, user_stats, games, achievements, etc.)
- **002_rls_policies.sql**: Implements Row Level Security for data protection
- **003_seed_data.sql**: Adds sample games, study materials, and achievement definitions

## Important Notes

- Migrations must be run in order
- RLS policies are critical for security - ensure 002_rls_policies.sql is run before deploying
- Seed data is optional but recommended for testing
