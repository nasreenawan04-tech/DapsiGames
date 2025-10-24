# DapsiGames - Educational Gaming Platform

## Overview

DapsiGames is a web-based educational platform designed to gamify learning for students aged 13-25. It integrates competitive elements like leaderboards, achievements, and point systems with educational content and interactive games. Users can track progress, compete globally, form study groups, and earn rewards. The platform offers both authenticated access with full features and limited guest access for previews. The business vision is to make learning engaging and competitive, leveraging market potential in educational technology and aiming to become a leading gamified learning solution.

## Recent Changes (October 2025)

**Phase 8: Review, Testing & Optimization - COMPLETED** (October 23, 2025)
- ✅ Code review and TypeScript improvements (fixed `any` type in db.ts)
- ✅ Build process verified (production build works)
- ✅ Visual verification completed (screenshots confirm UI works)
- ✅ Security infrastructure reviewed (Helmet, rate limiting, validation)
- ✅ Documentation suite created (comprehensive guides)
- ❌ **Critical Issue Identified**: WebSocket integration gap (frontend uses Supabase, backend uses custom `/ws`)
- ❌ **Functional Testing Gap**: No E2E testing performed
- ❌ **Database Initialization**: Missing tables (badges, levels)
- 📊 **Honest Assessment**: Application NOT production-ready (score: 5.5/10)
- 📋 **Path Forward**: Phase 8.5 recommended (fix critical issues, 16-24 hours)

**Phase 3: Gamification & Social Features - COMPLETED**
- ✅ Enhanced Leaderboard with podium display, time-period filtering (daily/weekly/monthly), and search
- ✅ Groups system with create, join, leave, group leaderboards, and activity feeds
- ✅ Profile page with achievements, friends list, and activity timeline
- ✅ Friend system integration with leaderboard filtering
- ✅ Time-based leaderboard using activity aggregation (`/api/activities/all`)
- ✅ Fixed cache invalidation for group operations
- ✅ All navigation and routing updated

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite for build and development
- Wouter for routing
- TanStack Query for server state management
- Tailwind CSS with shadcn/ui for styling

**Design System:**
- Custom design tokens blending gaming and education aesthetics.
- Inspired by Duolingo, Discord, Kahoot, and Linear for gamification, leaderboards, competitive UI, and typography.
- Comprehensive color system (primary blue, success green, energy orange).
- Dark mode support.
- Typography: Inter (headings), system fonts (body).

**State Management Strategy:**
- Authentication via React Context (AuthProvider).
- User data persisted in localStorage.
- Server state cached and synchronized by TanStack Query.
- Real-time updates via custom events.

**Component Organization:**
- Pages in `client/src/pages/`.
- Reusable UI components from shadcn/ui in `client/src/components/ui/`.
- Shared layout components in `client/src/components/`.
- Custom hooks in `client/src/hooks/`.

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL
- WebSocket (ws library) for real-time updates
- bcrypt for password hashing

**API Design:**
- RESTful API endpoints under `/api/`.
- **Authentication**: Login, logout, session management.
- **User Management**: Profile, stats, points updates.
- **Leaderboard**: Rankings with caching, real-time updates.
- **Activities**: User activities, all activities (for time filtering).
- **Games**: Game definitions, scores, completion tracking.
- **Study Materials**: Materials CRUD, bookmarking, progress.
- **Achievements**: Definitions, user achievements.
- **Friends**: Friend requests, accept/decline, friend list.
- **Groups**: Create, join, leave, members, group leaderboards, activity feeds.
- **Progress**: Item-specific progress tracking.
- Real-time WebSocket at `/ws` for leaderboard broadcasts.

**Database Schema:**
- **users**: Accounts, points, rank, avatar.
- **userStats**: Detailed user statistics for leaderboard.
- **games**: Game definitions.
- **achievementDefinitions**: Available achievements/badges.
- **userAchievements**: User-earned achievements.
- **studyMaterials**: Educational content.
- **userActivities**: Study and game activity logs with timestamps.
- **gameScores**: Game performance records.
- **bookmarks**: User bookmarks for materials.
- **userProgress**: Progress tracking for materials and games.
- **groups**: Study group definitions.
- **groupMembers**: Group membership records.
- **friendships**: User friendship connections.
- **groupChallenges**: Group-based challenges (future).
- **groupActivities**: Group activity feeds (future).

**Authentication & Security:**
- Password-based auth with bcrypt.
- Client-side user sessions in localStorage.
- Environment variables for database credentials.
- Environment-aware SSL/TLS.
- Row-level security for data protection.

**Real-Time Features:**
- WebSocket for leaderboard updates.
- Client auto-reconnect with retry logic.
- TanStack Query cache invalidation via WebSocket messages.

### Data Storage Solutions

**Database:**
- PostgreSQL on Neon serverless platform.
- @neondatabase/serverless for connection pooling.
- Database URL via `DATABASE_URL` environment variable.

**ORM Layer:**
- Drizzle ORM for type-safe queries.
- TypeScript schema definitions with Zod validation.
- Automatic type inference.

**Client-Side Storage:**
- localStorage for user session persistence.
- Local storage for guest mode data.

### Feature Specifications

**Core Features:**
- **Educational Content**: Study materials with search, filtering, bookmarking, and progress tracking.
- **Interactive Games**: QuizGame, WordPuzzleGame, MathChallengeGame with varying difficulty, real-time scoring, streaks, combos, and speed bonuses.
- **User Management**: Authentication, profile management, activity history.
- **Guest Mode**: Limited access with upgrade prompts.
- **Search Functionality**: Across study materials and games with multi-criteria filtering.

**Gamification & Social (Phase 3 - Completed):**
- **Enhanced Leaderboard**: 
  - Podium display for top 3 users with visual distinction
  - Global vs Friends filtering
  - Time-period filtering (daily, weekly, monthly, all-time) using activity aggregation
  - User search functionality
  - Current user position highlighting
  - Real-time updates via WebSocket
- **Groups/Social System**:
  - Create and manage study groups
  - Public/private group settings
  - Join/leave groups with immediate cache updates
  - Group leaderboards showing member rankings
  - Group activity feeds
  - Member management
- **Profile & Achievements**:
  - User profiles with avatar and stats
  - Achievement/badge system
  - Friends list
  - Activity timeline
  
**Technical Features:**
- **PWA Capabilities**: Offline support, caching, app-like experience.
- **Security**: Helmet.js, rate limiting, input validation, password hashing.
- **Performance**: Response caching, lazy loading with React.Suspense, query invalidation.
- **Code Quality**: ErrorBoundary, skeleton loaders, ESLint, Prettier, TypeScript strict mode.

## External Dependencies

**UI Component Libraries:**
- Radix UI primitives.
- shadcn/ui.
- cmdk (command palette).
- class-variance-authority.

**Data Fetching & State:**
- @tanstack/react-query.

**Form Handling:**
- react-hook-form.
- @hookform/resolvers with Zod.

**Date/Time:**
- date-fns.

**Development Tools:**
- tsx.
- esbuild.
- Replit-specific plugins.

**Build & Tooling:**
- PostCSS (Tailwind CSS, Autoprefixer).
- Vite plugins.

**Database Tooling:**
- drizzle-kit.

**Font Loading:**
- Google Fonts CDN (Inter, JetBrains Mono).