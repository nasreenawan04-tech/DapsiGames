import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "wouter";

export interface GuestRestrictionProps {
  feature: string;
  description?: string;
}

export function GuestRestriction({ feature, description }: GuestRestrictionProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto border-primary">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-6 h-6 text-primary" />
          <CardTitle>Premium Feature</CardTitle>
        </div>
        <CardDescription>
          {description || `${feature} is available for registered users only`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Create a free account to unlock:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Full access to all study materials</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Play all educational games</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Track your progress and earn achievements</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Compete on the global leaderboard</span>
            </li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Link href="/signup" className="flex-1">
            <Button className="w-full" data-testid="button-signup">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" data-testid="button-login">
              Log In
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export interface UpgradePromptProps {
  message: string;
  compact?: boolean;
}

export function UpgradePrompt({ message, compact = false }: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 bg-primary/10 border border-primary rounded-md">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Link href="/signup">
          <Button size="sm" data-testid="button-upgrade">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="border-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                Create an account to continue
              </p>
            </div>
          </div>
          <Link href="/signup">
            <Button data-testid="button-signup">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
