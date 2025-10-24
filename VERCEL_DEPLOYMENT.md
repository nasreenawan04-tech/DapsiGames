# Vercel Deployment Guide for DapsiGames

This document summarizes the changes made to make DapsiGames Vercel-friendly.

## Changes Made

### 1. PostCSS Configuration
- Fixed `postcss.config.js` to use ES module syntax (`export default`)
- This resolves the "module is not defined in ES module scope" error in Vercel's build environment

### 2. Server Configuration
Modified `server/index.ts` to support both traditional hosting and Vercel's serverless environment:

- Created `setupApp()` function to initialize the Express app
- Added `handler` export for Vercel serverless functions
- Conditional server startup: runs traditional server locally, exports handler for Vercel
- Fixed LSP errors (removed duplicate imports, added null checks)

### 3. Vercel Configuration Files

#### `vercel.json`
Created comprehensive Vercel configuration:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "functions": {
    "api/index.js": {
      "maxDuration": 60
    }
  },
  "routes": [
    // Static assets routing
    // API routing
  ]
}
```

#### `api/index.js`
Created serverless function entry point that imports the built Express app.

#### `.vercelignore`
Added ignore patterns for Vercel deployment to exclude unnecessary files.

### 4. Documentation

#### Updated README.md
Added comprehensive deployment documentation including:
- Prerequisites for Vercel deployment
- Step-by-step deployment instructions (Dashboard and CLI)
- Database setup guides (Vercel Postgres, Neon, Supabase)
- Environment variables configuration
- Important notes about serverless limitations

#### Created VERCEL_DEPLOYMENT.md
This file - complete deployment reference and troubleshooting guide.

### 5. Environment Variables Template
`.env.example` already includes all necessary environment variables for Vercel deployment.

## How It Works

### Local Development (Replit/Traditional Hosting)
The app runs as a traditional Express server:
1. Server starts on port 5000
2. WebSocket connections work normally
3. Vite dev server handles frontend with HMR

### Vercel Production
The app runs as serverless functions:
1. Express app is bundled with esbuild
2. Exported as a serverless handler in `api/index.js`
3. Static files served from `dist/public`
4. Database sessions via PostgreSQL (not in-memory)

## Deployment Checklist

Before deploying to Vercel:

- [ ] Push code to Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Set up production PostgreSQL database
- [ ] Configure environment variables in Vercel:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `NODE_ENV=production`
  - Optional: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [ ] Run `npm run db:push` to sync database schema
- [ ] Deploy via Vercel Dashboard or CLI

## Important Considerations

### WebSocket Support
⚠️ **Limitation**: Vercel's serverless functions have limited WebSocket support. 

The real-time features (leaderboard updates, live notifications) may not work as expected on Vercel. For full WebSocket functionality, consider alternative platforms:
- Railway
- Render
- Fly.io
- DigitalOcean App Platform

### Session Management
- **Development**: In-memory sessions via `memorystore`
- **Production (Vercel)**: PostgreSQL sessions via `connect-pg-simple`

### Cold Starts
Vercel serverless functions experience cold starts after periods of inactivity. The first request may take 1-3 seconds longer than subsequent requests.

## Troubleshooting

### Build Errors

**Error: "module is not defined in ES module scope"**
- Ensure `postcss.config.js` uses `export default` (fixed ✓)

**Error: "Command 'npm run build' exited with 1"**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Ensure TypeScript compiles without errors: `npm run check`

### Runtime Errors

**Database Connection Failed**
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check database allows connections from Vercel's IP ranges
- For Neon: Enable "Pooled connection" string

**Session Issues**
- Verify `SESSION_SECRET` is set
- Check PostgreSQL session table exists

**Static Assets Not Loading**
- Verify build command outputs to `dist/public`
- Check route configuration in `vercel.json`

## Alternative: Deploy to Railway (Full Feature Support)

For full WebSocket support and simpler deployment:

1. Sign up at [Railway](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

Railway supports persistent connections and is better suited for this full-stack app with real-time features.

## Summary

Your DapsiGames application is now configured for Vercel deployment with:
- ✅ Proper build configuration
- ✅ Serverless function support
- ✅ Static asset serving
- ✅ PostgreSQL database compatibility
- ✅ Environment variable setup
- ✅ Comprehensive documentation

**Note**: While the app will deploy successfully to Vercel, consider Railway or similar platforms for full WebSocket functionality.
