import { Trophy, Medal, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeaderboard } from "@/lib/api-hooks";
import { useAuth } from "@/lib/auth";

export default function Leaderboard() {
  const { data: leaderboardData, isLoading } = useLeaderboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allUsers = leaderboardData || [];
  const topUsers = allUsers.slice(0, 3);
  const otherUsers = allUsers.slice(3);


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-leaderboard-title">
            <Trophy className="h-8 w-8 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See how you rank against other learners around the world
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a user..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select defaultValue="all-time">
            <SelectTrigger className="md:w-48" data-testid="select-timeframe">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="md:w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="language">Language</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {topUsers.map((userData, index) => (
            <Card
              key={userData.id}
              className={`hover-elevate transition-all duration-200 ${
                index === 0 ? "ring-2 ring-gold" :
                index === 1 ? "ring-2 ring-silver" :
                "ring-2 ring-bronze"
              }`}
              data-testid={`podium-${index + 1}`}
            >
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                  index === 0 ? "bg-gold" :
                  index === 1 ? "bg-silver" :
                  "bg-bronze"
                }`}>
                  {index === 0 ? (
                    <Trophy className="h-8 w-8 text-white" />
                  ) : (
                    <Medal className={`h-8 w-8 ${index === 1 ? "text-gray-700" : "text-white"}`} />
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{userData.fullName}</h3>
                <p className="text-2xl font-bold font-mono text-primary mb-2">
                  {userData.points.toLocaleString()}
                </p>
                <Badge variant="secondary">Rank #{userData.rank}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>All participants ranked by total points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherUsers.map((userData, index) => (
                <div
                  key={userData.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover-elevate ${
                    userData.id === user?.id
                      ? "bg-primary/10 ring-2 ring-primary/20"
                      : "bg-muted/30"
                  }`}
                  data-testid={`leaderboard-entry-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      userData.id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {userData.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userData.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userData.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-semibold ${
                        userData.id === user?.id ? "text-primary" : ""
                      }`}>
                        {userData.id === user?.id ? "You" : userData.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userData.points.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" data-testid="button-load-more">
                Load More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
