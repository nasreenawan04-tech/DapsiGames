import { lazy } from "react";

export const LazyDashboard = lazy(() => import("@/pages/dashboard"));
export const LazyLeaderboard = lazy(() => import("@/pages/leaderboard"));
export const LazyProfile = lazy(() => import("@/pages/profile"));
export const LazyGames = lazy(() => import("@/pages/games"));
export const LazyGamePlay = lazy(() => import("@/pages/game-play"));
export const LazyStudy = lazy(() => import("@/pages/study"));
export const LazyGuest = lazy(() => import("@/pages/guest"));
export const LazyPomodoro = lazy(() => import("@/pages/pomodoro"));
export const LazyTasks = lazy(() => import("@/pages/tasks"));
