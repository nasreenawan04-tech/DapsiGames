import { Link } from "wouter";
import { Trophy, Lock, Zap, Award, BookOpen, Gamepad2, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Guest() {
  const leaderboardPreview = [
    { rank: 1, name: "User ****", points: "****", badge: "gold" },
    { rank: 2, name: "User ****", points: "****", badge: "silver" },
    { rank: 3, name: "User ****", points: "****", badge: "bronze" },
  ];

  const features = [
    { name: "Access to all games", free: false, premium: true },
    { name: "Full study materials", free: false, premium: true },
    { name: "Real-time leaderboard", free: false, premium: true },
    { name: "Achievement badges", free: false, premium: true },
    { name: "Progress tracking", free: false, premium: true },
    { name: "Custom avatar", free: false, premium: true },
    { name: "Limited demo games", free: true, premium: true },
    { name: "View leaderboard preview", free: true, premium: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3" data-testid="text-guest-title">
              Welcome to DapsiGames!
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              You're currently in guest mode with limited access. Create a free account to unlock all features and start competing!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button size="lg" data-testid="button-signup">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-login">
                  Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Leaderboard Preview
              </CardTitle>
              <CardDescription>
                Top performers compete for glory. Sign up to see your ranking!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardPreview.map((user) => (
                  <div
                    key={user.rank}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 relative"
                    data-testid={`guest-leaderboard-${user.rank}`}
                  >
                    <div className="flex items-center gap-4 blur-sm">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                          user.rank === 1
                            ? "bg-gold text-white"
                            : user.rank === 2
                            ? "bg-silver text-gray-700"
                            : "bg-bronze text-white"
                        }`}
                      >
                        {user.rank}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.points} points</div>
                      </div>
                    </div>
                    <Lock className="h-5 w-5 text-muted-foreground absolute right-4" />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/signup">
                  <Button variant="outline" className="w-full" data-testid="button-view-full-leaderboard">
                    <Lock className="h-4 w-4 mr-2" />
                    Sign Up to View Full Leaderboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-secondary" />
                  Try a Demo Game
                </CardTitle>
                <CardDescription>
                  Experience our learning platform with a sample quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-accent/10">
                    <h3 className="font-semibold mb-2">Math Quiz Demo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Try a limited version of our popular math quiz
                    </p>
                    <Link href="/games/math-quiz">
                      <Button className="w-full" data-testid="button-demo-game">
                        Play Demo
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Sign up for access to 20+ educational games
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Study Materials Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="space-y-3 blur-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="font-medium">Algebra Fundamentals</p>
                      <p className="text-sm text-muted-foreground">Master algebraic equations</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="font-medium">Physics Basics</p>
                      <p className="text-sm text-muted-foreground">Newton's laws explained</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link href="/signup">
                      <Button data-testid="button-unlock-study">
                        <Lock className="h-4 w-4 mr-2" />
                        Sign Up to Unlock
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Free vs Premium Features</CardTitle>
            <CardDescription>See what you're missing out on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                    data-testid={`feature-${index}`}
                  >
                    <span className="font-medium">{feature.name}</span>
                    <div className="flex items-center gap-8">
                      <div className="text-center w-20">
                        <p className="text-xs text-muted-foreground mb-1">Guest</p>
                        {feature.free ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </div>
                      <div className="text-center w-20">
                        <p className="text-xs text-muted-foreground mb-1">Premium</p>
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link href="/signup">
                  <Button size="lg" data-testid="button-upgrade">
                    <Award className="h-4 w-4 mr-2" />
                    Upgrade to Premium - It's Free!
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
