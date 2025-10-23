# DapsiGames - Educational Gaming Platform

## Overview

DapsiGames is a web-based educational platform designed to gamify learning for students aged 13-25. It integrates competitive elements like leaderboards, achievements, and point systems with educational content and interactive games. Users can track progress, compete globally, and earn rewards. The platform offers both authenticated access with full features and limited guest access for previews. The business vision is to make learning engaging and competitive, leveraging market potential in educational technology and aiming to become a leading gamified learning solution.

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
- Authentication, user, games, achievements, study materials, activities, and scores endpoints.
- Real-time WebSocket at `/ws` for leaderboard broadcasts.

**Database Schema:**
- **users**: Accounts, points, rank.
- **games**: Game definitions.
- **achievements**: User-earned badges.
- **studyMaterials**: Educational content.
- **userActivities**: Study and game activity logs.
- **gameScores**: Game performance records.
- **bookmarks**: User bookmarks for materials.

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
- **Educational Content**: Study materials with search, filtering, bookmarking, and progress tracking.
- **Interactive Games**: QuizGame, WordPuzzleGame, MathChallengeGame with varying difficulty, real-time scoring, streaks, combos, and speed bonuses.
- **Gamification**: Leaderboards, achievements, point systems, badges.
- **User Management**: Authentication, profile management, activity history.
- **Guest Mode**: Limited access with upgrade prompts.
- **Search Functionality**: Across study materials and games with multi-criteria filtering.
- **PWA Capabilities**: Offline support, caching, app-like experience.
- **Security**: Helmet.js, rate limiting, input validation.
- **Performance**: Response caching, lazy loading with React.Suspense.
- **Code Quality**: ErrorBoundary, skeleton loaders, ESLint, Prettier.

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