# Complete Guide: Add Supabase to Vercel

## Step 1: Create a Supabase Database

1. **Go to Supabase**: https://supabase.com
2. **Click "Start your project"** (or "Sign In" if you have an account)
3. **Sign up/Login** using:
   - GitHub (recommended)
   - Or email

4. **Create a New Project**:
   - Click **"New Project"**
   - Project Name: `dapsi-games` (or any name you like)
   - Database Password: **Create a strong password and SAVE IT** (you'll need this!)
   - Region: Choose closest to your users (e.g., US East, Europe, Asia)
   - Click **"Create new project"**

5. **Wait 2-3 minutes** for Supabase to provision your database

## Step 2: Get Your Database Connection String

1. **In your Supabase project**, click on the **"Connect"** button (top right)
   - Or go to: Settings → Database (in left sidebar)

2. **Find "Connection String"** section
   - Click on **"URI"** tab
   - You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

3. **Copy the connection string**
   - **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the actual password you created in Step 1
   - Final format should look like:
   ```
   postgresql://postgres:YourActualPassword@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

4. **Add connection pooling** (recommended for Vercel):
   - Instead of the direct connection, use the **"Transaction"** pooler
   - Change port from `:5432` to `:6543`
   - Final connection string:
   ```
   postgresql://postgres:YourActualPassword@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
   ```

## Step 3: Add Database to Vercel

1. **Go to Vercel**: https://vercel.com

2. **Open your project** (`dapsi-gamess`)

3. **Go to Settings**:
   - Click on your project
   - Click **"Settings"** tab at the top
   - Click **"Environment Variables"** in the left sidebar

4. **Add the DATABASE_URL**:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your Supabase connection string
     ```
     postgresql://postgres:YourPassword@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
     ```
   - **Environments**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

## Step 4: Initialize Your Database Tables

You need to run the database migrations on your Supabase database:

### Option A: Run from Replit (Easiest)

1. **In Replit**, open the Shell and run:
   ```bash
   # Set the Supabase DATABASE_URL temporarily
   export DATABASE_URL="postgresql://postgres:YourPassword@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true"
   
   # Run the database setup
   npm run db:push
   ```

2. **Seed the database** (optional, for initial data):
   ```bash
   # The seed data will be created automatically when you first access the app
   # Or you can manually trigger it by visiting: https://your-app.vercel.app/api/seed
   ```

### Option B: Use Supabase SQL Editor

1. **Go to Supabase** → SQL Editor
2. **Copy each migration file** from your project and run them:
   - `server/migrations/001_initial_schema.sql`
   - `server/migrations/002_rls_policies.sql`
   - `server/migrations/003_seed_data.sql`
   - `server/migrations/004_social_features.sql`

## Step 5: Deploy to Vercel

1. **Push your fixed code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Supabase database support"
   git push origin main
   ```

2. **Vercel will automatically redeploy**
   - Go to your Vercel dashboard
   - Watch the deployment progress
   - Wait for "Ready" status

3. **Visit your live site**:
   - Click on the deployment URL
   - Your app should now load correctly!

## Step 6: Verify Everything Works

1. **Visit your site**: `https://dapsi-gamess.vercel.app`
2. **Check the API health**: `https://dapsi-gamess.vercel.app/api/health`
   - Should return: `{"status":"ok"}`
3. **Try signing up** for a new account
4. **Test the features**: games, leaderboard, study materials

## Troubleshooting

### If you see "Database not available" error:

1. **Check the connection string format**:
   - Make sure you replaced `[YOUR-PASSWORD]` with your actual password
   - Verify no extra spaces or characters
   - Use port `:6543` for connection pooling

2. **Check Vercel environment variables**:
   - Go to Settings → Environment Variables
   - Make sure `DATABASE_URL` is set for Production
   - If you just added it, redeploy: Deployments → ... → Redeploy

3. **Check Supabase database is running**:
   - Go to Supabase → your project
   - Make sure it says "Active" (not "Paused")

### If deployment fails:

1. **Check Vercel deployment logs**:
   - Click on the failed deployment
   - Look for error messages
   - Most common: incorrect environment variable format

2. **Test locally first**:
   ```bash
   export DATABASE_URL="your-supabase-url"
   npm run build
   npm start
   ```

## Connection String Quick Reference

**Supabase Location**: Settings → Database → Connection String → URI

**Format for Vercel**:
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
```

**Important**:
- Use port `:6543` (not `:5432`) for Vercel serverless functions
- Add `?pgbouncer=true` at the end
- Replace `YOUR_PASSWORD` with your actual database password

## What Happens After Setup

✅ **Your app will**:
- Load correctly (no white screen!)
- Store all user data in Supabase
- Support user registration and login
- Save games, progress, achievements
- Work with groups, tasks, and all features

⚠️ **Note about WebSockets**:
- Real-time leaderboard updates won't work on Vercel (serverless limitation)
- All other features work perfectly!
- If you need real-time features, consider Railway or Render hosting

## Need Help?

Common issues:
- **White screen**: DATABASE_URL not set or incorrect format
- **500 errors**: Database tables not created (run migrations)
- **Connection timeout**: Wrong port or connection pooling not enabled

---

**Ready?** Start with Step 1 and follow through to Step 6. Your app will be live in about 10-15 minutes!
