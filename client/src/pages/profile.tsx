import { User, Award, Trophy, TrendingUp, Calendar, Settings, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const user = {
    id: "user-12",
    fullName: "Alex Johnson",
    email: "alex.johnson@example.com",
    points: 8450,
    rank: 12,
    joinedDate: "Jan 15, 2024",
    streak: 7,
    avatarUrl: "",
  };

  const achievements = [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first study session",
      icon: "🎯",
      unlocked: true,
      unlockedAt: "Jan 16, 2024",
    },
    {
      id: 2,
      name: "Quick Learner",
      description: "Earn 1000 points in one week",
      icon: "⚡",
      unlocked: true,
      unlockedAt: "Jan 22, 2024",
    },
    {
      id: 3,
      name: "Math Master",
      description: "Complete 10 math quizzes",
      icon: "🔢",
      unlocked: true,
      unlockedAt: "Feb 5, 2024",
    },
    {
      id: 4,
      name: "Streak Champion",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlocked: true,
      unlockedAt: "Feb 10, 2024",
    },
    {
      id: 5,
      name: "Top 20",
      description: "Reach top 20 on leaderboard",
      icon: "🏆",
      unlocked: false,
      progress: 60,
    },
    {
      id: 6,
      name: "Science Guru",
      description: "Complete 20 science quizzes",
      icon: "🧪",
      unlocked: false,
      progress: 35,
    },
  ];

  const stats = [
    { label: "Total Points", value: user.points.toLocaleString(), icon: Trophy },
    { label: "Global Rank", value: `#${user.rank}`, icon: TrendingUp },
    { label: "Study Streak", value: `${user.streak} days`, icon: Calendar },
    { label: "Achievements", value: "23/50", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-1" data-testid="text-profile-name">
                      {user.fullName}
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="outline" data-testid="button-edit-profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">Member since {user.joinedDate}</Badge>
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                    Rank #{user.rank}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/30"
                      data-testid={`stat-${index}`}
                    >
                      <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="achievements" data-testid="tab-achievements">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              Activity History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  {achievements.filter((a) => a.unlocked).length} of {achievements.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className={`hover-elevate transition-all duration-200 ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-primary/5 to-secondary/5"
                          : "opacity-60"
                      }`}
                      data-testid={`achievement-${achievement.id}`}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <div
                          className={`text-5xl ${!achievement.unlocked && "grayscale opacity-50"}`}
                        >
                          {achievement.icon}
                        </div>
                        <div>
                          <h3 className="font-bold mb-1">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked ? (
                          <Badge variant="secondary" className="w-full justify-center">
                            Unlocked {achievement.unlockedAt}
                          </Badge>
                        ) : (
                          <div className="space-y-2">
                            <Progress value={achievement.progress || 0} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {achievement.progress}% complete
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your learning journey over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      date: "Today",
                      activities: [
                        { time: "2:30 PM", action: "Completed Math Quiz", points: 150 },
                        { time: "10:15 AM", action: "Studied Algebra Module", points: 100 },
                      ],
                    },
                    {
                      date: "Yesterday",
                      activities: [
                        { time: "4:45 PM", action: "Science Trivia Challenge", points: 120 },
                        { time: "1:20 PM", action: "Unlocked Achievement Badge", points: 50 },
                      ],
                    },
                    {
                      date: "Feb 10, 2024",
                      activities: [
                        { time: "3:15 PM", action: "Geography Quiz Master", points: 130 },
                      ],
                    },
                  ].map((day, dayIndex) => (
                    <div key={dayIndex} data-testid={`activity-day-${dayIndex}`}>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                        {day.date}
                      </h3>
                      <div className="space-y-2 ml-4 border-l-2 border-muted pl-4">
                        {day.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                          >
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">{activity.time}</p>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                              +{activity.points} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
