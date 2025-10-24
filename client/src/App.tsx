import { Switch, Route } from "wouter";
import { Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import About from "@/pages/about";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

import {
  LazyDashboard,
  LazyProfile,
  LazyGames,
  LazyGamePlay,
  LazyStudy,
  LazyGuest,
  LazyPomodoro,
  LazyTasks,
  LazyGroups,
  LazyPlanner,
} from "@/lib/lazy-components";
import Leaderboard from "@/pages/leaderboard";
import Subscribe from "@/pages/subscribe";

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
            <Route path="/dashboard">
              {() => <ProtectedRoute><LazyDashboard /></ProtectedRoute>}
            </Route>
            <Route path="/pomodoro">
              {() => <ProtectedRoute><LazyPomodoro /></ProtectedRoute>}
            </Route>
            <Route path="/tasks">
              {() => <ProtectedRoute><LazyTasks /></ProtectedRoute>}
            </Route>
            <Route path="/planner">
              {() => <ProtectedRoute><LazyPlanner /></ProtectedRoute>}
            </Route>
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/profile">
              {() => <ProtectedRoute><LazyProfile /></ProtectedRoute>}
            </Route>
            <Route path="/study">
              {() => <ProtectedRoute><LazyStudy /></ProtectedRoute>}
            </Route>
            <Route path="/games" component={LazyGames} />
            <Route path="/games/:gameId">
              {() => <ProtectedRoute><LazyGamePlay /></ProtectedRoute>}
            </Route>
            <Route path="/groups">
              {() => <ProtectedRoute><LazyGroups /></ProtectedRoute>}
            </Route>
            <Route path="/subscribe">
              {() => <ProtectedRoute><Subscribe /></ProtectedRoute>}
            </Route>
            <Route path="/guest" component={LazyGuest} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms-of-service" component={TermsOfService} />
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
