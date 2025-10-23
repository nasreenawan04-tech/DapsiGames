import { Link } from "wouter";
import { Trophy, Target, Award, BookOpen, Gamepad2, TrendingUp, Zap, Clock, Flame, Timer, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { useActivities, useLeaderboard } from "@/lib/api-hooks";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { Streak, Task, StudySession } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(user?.id);
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard();
  
  // Fetch streak data
  const { data: streak } = useQuery<Streak>({
    queryKey: [`/api/streaks/${user?.id}`],
    enabled: !!user,
  });

  // Fetch tasks data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${user?.id}`],
    enabled: !!user,
  });

  // Fetch study sessions
  const { data: sessions = [] } = useQuery<StudySession[]>({
    queryKey: [`/api/study-sessions/${user?.id}`],
    enabled: !!user,
  });
  
  if (!user) {
    return null;
  }

  const userRank = leaderboard.findIndex(u => u.id === user.id) + 1;
  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedSessions = sessions.filter(s => s.completed).length;

  const stats = [
    {
      title: "Total XP",
      value: (user.points || 0).toLocaleString(),
      change: `${activities.length} activities`,
      icon: Trophy,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Current Streak",
      value: `${streak?.currentStreak || 0} days`,
      change: `Best: ${streak?.longestStreak || 0} days`,
      icon: Flame,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Study Sessions",
      value: completedSessions.toString(),
      change: "Pomodoro sessions",
      icon: Timer,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Tasks",
      value: activeTasks.toString(),
      change: `${tasks.length} total tasks`,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  const recentActivities = activities.slice(0, 4).map(activity => ({
    type: activity.activityType,
    title: activity.activityType === "game" ? "Completed Game" : "Completed Study Material",
    points: activity.pointsEarned,
    timestamp: formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }),
    icon: activity.activityType === "game" ? Gamepad2 : BookOpen,
  }));

  const quickActions = [
    {
      title: "Pomodoro Timer",
      description: "Start a focus session",
      icon: Timer,
      href: "/pomodoro",
      color: "primary",
    },
    {
      title: "Manage Tasks",
      description: "Track your goals",
      icon: Target,
      href: "/tasks",
      color: "secondary",
    },
    {
      title: "Study Materials",
      description: "Continue learning",
      icon: BookOpen,
      href: "/study",
      color: "accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
            Welcome back, {user.fullName.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            You're doing great! Here's your progress overview.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-stat-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover-elevate active-elevate-2 transition-all duration-200 cursor-pointer h-full" data-testid={`card-quick-action-${index}`}>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        action.color === "primary" ? "bg-primary/10" :
                        action.color === "secondary" ? "bg-secondary/10" :
                        "bg-accent/10"
                      }`}>
                        <action.icon className={`h-6 w-6 ${
                          action.color === "primary" ? "text-primary" :
                          action.color === "secondary" ? "text-secondary" :
                          "text-accent"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Your latest achievements and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities yet. Start playing games or studying to earn points!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover-elevate"
                      data-testid={`activity-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          activity.type === "game" ? "bg-secondary/10" :
                          activity.type === "study" ? "bg-primary/10" :
                          "bg-accent/10"
                        }`}>
                          <activity.icon className={`h-5 w-5 ${
                            activity.type === "game" ? "text-secondary" :
                            activity.type === "study" ? "text-primary" :
                            "text-accent"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        +{activity.points} pts
                      </Badge>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Daily Goal
                </CardTitle>
                <CardDescription>Earn 500 points today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{(user.points || 0) % 500}/500</span>
                  </div>
                  <Progress value={((user.points || 0) % 500) / 5} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Great work! You're 68% of the way to your daily goal. Keep learning to earn the remaining points!
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold">Weekend Challenge!</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 1000 points this weekend for a special badge
                  </p>
                  <Button variant="outline" className="w-full" data-testid="button-join-challenge">
                    Join Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
