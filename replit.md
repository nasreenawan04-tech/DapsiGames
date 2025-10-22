# DapsiGames - Educational Gaming Platform

## Overview

DapsiGames is a web-based educational platform that gamifies the learning experience for students aged 13-25. The platform combines competitive elements like leaderboards, achievements, and point systems with educational content including study materials and interactive games. Students can track their progress, compete with peers globally, and earn badges and rewards as they master new subjects.

The application provides both authenticated and guest access modes, with full features available to registered users and limited preview capabilities for guests exploring the platform.

## Recent Changes

**October 22, 2025 - Phase 4: Study Materials and Gaming Interfaces Completed**
- Added bookmarks table to database schema with user-study material relationships
- Implemented bookmark API endpoints (POST/DELETE /api/bookmarks/:userId/:materialId)
- Enhanced Study Materials page with:
  - Search functionality across titles and content
  - Multi-level filtering (subject category, difficulty level)
  - Tabs for All/Bookmarked/Completed materials
  - Bookmark toggle with real-time UI updates
  - Progress tracking with completion status
- Enhanced Games page with:
  - API integration loading from database
  - Search across game titles and descriptions  
  - Category and difficulty filtering
  - Interactive game cards with point rewards display
- Fixed critical bugs:
  - apiRequest now handles 204 No Content responses without throwing errors
  - Environment-aware SSL configuration (disabled in dev, enabled in production) for Neon database
- Database seeded with sample study materials and games for testing

**October 22, 2025 - Phase 3: Dashboard and Profile Management Completed**
- Enhanced Profile page to use real user data from auth context instead of mock data
- Integrated achievements display with real backend data using useAchievements hook
- Integrated activity history with real backend data using useActivities hook  
- Added PATCH /api/user/:userId/profile endpoint for updating user profiles
- Implemented useUpdateProfile mutation hook with localStorage and auth context synchronization
- Created functional edit profile dialog with name editing capability
- Added comprehensive client and server-side validation
- Enhanced AuthProvider with user-updated event listener for real-time state sync across components

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for component-based UI development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS for utility-first styling with shadcn/ui component library

**Design System:**
- Custom design tokens following a gaming + education fusion aesthetic
- References design patterns from Duolingo (gamification), Discord (leaderboards), Kahoot (competitive UI), and Linear (typography)
- Comprehensive color system with primary blue (#1e40af), success green (#10b981), and energy orange (#f59e0b)
- Dark mode support with separate color variables
- Typography using Inter for headings and system fonts for body text

**State Management Strategy:**
- Authentication state managed through React Context (AuthProvider)
- User data persisted in localStorage for session management
- Server state cached and synchronized via TanStack Query
- Real-time updates triggered through custom events (user-updated event)

**Component Organization:**
- Page components in `client/src/pages/` (home, dashboard, leaderboard, profile, study, games, auth flows)
- Reusable UI components from shadcn/ui in `client/src/components/ui/`
- Shared layout components (Header, Footer) in `client/src/components/`
- Custom hooks in `client/src/hooks/` for mobile detection and toast notifications

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL as the database platform
- WebSocket (ws library) for real-time leaderboard updates
- bcrypt for password hashing

**API Design:**
- RESTful API endpoints under `/api/` prefix
- Authentication endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- Resource endpoints for users, games, achievements, study materials, activities, and scores
- Real-time WebSocket endpoint at `/ws` for live leaderboard broadcasts

**Database Schema:**
- **users**: Core user accounts with email, hashed password, full name, points, rank, and avatar
- **games**: Educational game definitions with title, description, category, difficulty, and points
- **achievements**: User-earned badges with name, description, icon, and unlock timestamp
- **studyMaterials**: Educational content organized by title, category, difficulty, and content
- **userActivities**: Activity log tracking study sessions and game completions with timestamps and points
- **gameScores**: Individual game performance records linking users, games, scores, and completion times
- **bookmarks**: User bookmarks for study materials with composite primary key (userId, materialId)

**Authentication & Security:**
- Password-based authentication with bcrypt hashing (10 salt rounds)
- User sessions stored in localStorage on client side
- Database credentials secured via environment variables
- Environment-aware SSL/TLS configuration (development: relaxed, production: strict certificate validation)
- Row-level security intended for data protection (mentioned in requirements)

**Real-Time Features:**
- WebSocket connection managed separately from HTTP server
- Broadcasts leaderboard updates to all connected clients when point changes occur
- Client auto-reconnects with 3-second retry interval on connection loss
- TanStack Query cache invalidation triggered by WebSocket messages

### Data Storage Solutions

**Database:**
- PostgreSQL hosted on Neon serverless platform
- Connection pooling via @neondatabase/serverless
- WebSocket constructor override for serverless compatibility
- Database URL required via DATABASE_URL environment variable

**ORM Layer:**
- Drizzle ORM provides type-safe query building
- Schema definitions in TypeScript with Zod validation
- Automatic type inference for inserts and selects
- Migration files generated in `./migrations` directory

**Client-Side Storage:**
- localStorage for user session persistence
- Guest mode data stored locally (mentioned in requirements)
- No cookies used for session management

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, etc.)
- shadcn/ui configuration for styled component layer
- cmdk for command palette functionality
- class-variance-authority for component variant management

**Data Fetching & State:**
- @tanstack/react-query for server state synchronization
- Built-in refetch strategies disabled (manual control preferred)

**Form Handling:**
- react-hook-form for form state management
- @hookform/resolvers with Zod for schema validation
- Comprehensive validation schemas for auth forms

**Date/Time:**
- date-fns for date formatting and relative time display

**Development Tools:**
- tsx for TypeScript execution in development
- esbuild for production server bundling
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner

**Build & Tooling:**
- PostCSS with Tailwind CSS and Autoprefixer
- Vite plugins for React, runtime error modal, and development features
- Path aliases configured: `@/` for client source, `@shared/` for shared code, `@assets/` for static assets

**Database Tooling:**
- drizzle-kit for schema migrations and database push operations
- @jridgewell/trace-mapping for source map support

**Font Loading:**
- Google Fonts CDN for Inter (weights 400-800) and JetBrains Mono typefaces
- Preconnect optimization for fonts.googleapis.com and fonts.gstatic.com