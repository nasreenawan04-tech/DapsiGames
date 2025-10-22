import { Link } from "wouter";
import { Trophy, Target, Award, TrendingUp, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@assets/generated_images/Students_competitive_learning_hero_9fe873f8.png";

export default function Home() {
  const topUsers = [
    { rank: 1, name: "Sarah M.", points: 12450, badge: "gold" },
    { rank: 2, name: "Alex K.", points: 11230, badge: "silver" },
    { rank: 3, name: "Maya L.", points: 10890, badge: "bronze" },
    { rank: 4, name: "Jordan P.", points: 9876, badge: "none" },
    { rank: 5, name: "Taylor R.", points: 9234, badge: "none" },
  ];

  const features = [
    {
      icon: Target,
      title: "Gamified Learning",
      description: "Transform study sessions into engaging challenges with points and rewards.",
    },
    {
      icon: Trophy,
      title: "Real-Time Leaderboards",
      description: "Compete with peers and track your progress on live global rankings.",
    },
    {
      icon: Award,
      title: "Achievements & Badges",
      description: "Unlock special badges and achievements as you master new subjects.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Visualize your learning journey with detailed analytics and stats.",
    },
    {
      icon: Zap,
      title: "Educational Games",
      description: "Learn through interactive games designed by education experts.",
    },
    {
      icon: Users,
      title: "Competitive Community",
      description: "Join thousands of students making learning fun and social.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-beta">
                <Zap className="h-3 w-3 mr-1" />
                Now Live
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight" data-testid="text-hero-title">
                Learn While You
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"> Play</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg" data-testid="text-hero-description">
                Transform your learning experience with competitive gaming. Track progress, earn points, and climb the leaderboard while mastering new subjects.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-signup">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/guest">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-hero-demo">
                    Try Demo
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <div className="text-2xl font-bold text-primary">15K+</div>
                  <div className="text-sm text-muted-foreground">Active Learners</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-2xl font-bold text-secondary">50K+</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-2xl font-bold text-accent">100+</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
              <img
                src={heroImage}
                alt="Students learning through gaming"
                className="relative rounded-xl shadow-2xl"
                data-testid="img-hero"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">
              Why Choose DapsiGames?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine the best of education and gaming to create an engaging learning platform that keeps you motivated.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-leaderboard-title">
              Top Performers This Week
            </h2>
            <p className="text-muted-foreground">
              See who's leading the pack. Will you be next?
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg hover-elevate ${
                      user.rank <= 3 ? "bg-primary/5" : ""
                    }`}
                    data-testid={`leaderboard-entry-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                          user.rank === 1
                            ? "bg-gold text-white"
                            : user.rank === 2
                            ? "bg-silver text-gray-700"
                            : user.rank === 3
                            ? "bg-bronze text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.rank}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.points.toLocaleString()} points
                        </div>
                      </div>
                    </div>
                    {user.rank === 1 && <Trophy className="h-5 w-5 text-gold" />}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/signup">
                  <Button variant="outline" className="w-full" data-testid="button-join-leaderboard">
                    Join the Competition
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students making education fun, competitive, and rewarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" data-testid="button-cta-signup">
                Create Free Account
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" data-testid="button-cta-leaderboard">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
