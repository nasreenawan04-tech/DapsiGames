import { Switch, Route } from "wouter";
import { Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton } from "@/components/SkeletonLoader";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import AuthCallback from "@/pages/auth-callback";
import ResetPassword from "@/pages/reset-password";

import {
  LazyDashboard,
  LazyProfile,
  LazyGames,
  LazyGamePlay,
  LazyStudy,
  LazyGuest,
} from "@/lib/lazy-components";
import LeaderboardSimple from "@/pages/leaderboard-simple";

function Router() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        user={user ? {
          fullName: user.fullName,
          points: user.points || 0,
          avatarUrl: user.avatarUrl || undefined,
        } : undefined}
        onLogout={logout}
      />
      <main className="flex-1">
        <Suspense fallback={<DashboardSkeleton />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/auth/callback" component={AuthCallback} />
            <Route path="/auth/reset-password" component={ResetPassword} />
            <Route path="/dashboard" component={LazyDashboard} />
            <Route path="/leaderboard" component={LeaderboardSimple} />
            <Route path="/profile" component={LazyProfile} />
            <Route path="/study" component={LazyStudy} />
            <Route path="/games" component={LazyGames} />
            <Route path="/games/:gameId" component={LazyGamePlay} />
            <Route path="/guest" component={LazyGuest} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
