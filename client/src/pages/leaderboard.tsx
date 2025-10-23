import { useState, useMemo } from "react";
import { Trophy, Medal, Crown, Search, Loader2, Users, Globe, Clock, TrendingUp, Flame, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeaderboard, useFriends, useAllActivities } from "@/lib/api-hooks";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboardData, isLoading } = useLeaderboard();
  const { data: allActivities = [] } = useAllActivities();
  const { user } = useAuth();
  const { data: friends = [] } = useFriends(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"global" | "friends">("global");
  const [timePeriod, setTimePeriod] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(20);

  // Calculate time-filtered leaderboard
  const timeFilteredLeaderboard = useMemo(() => {
    if (timePeriod === "all" || !allActivities.length) {
      return null; // Use regular leaderboard
    }

    const now = new Date();
    let cutoffDate = new Date();
    
    if (timePeriod === "daily") {
      cutoffDate.setDate(now.getDate() - 1);
    } else if (timePeriod === "weekly") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timePeriod === "monthly") {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    // Filter activities by time period
    const filteredActivities = allActivities.filter((activity: any) => {
      return new Date(activity.timestamp) >= cutoffDate;
    });

    // Aggregate points by user
    const userPointsMap = new Map<string, { userId: string; fullName: string; avatarUrl: string; totalPoints: number }>();
    
    filteredActivities.forEach((activity: any) => {
      const existing = userPointsMap.get(activity.userId);
      if (existing) {
        existing.totalPoints += activity.pointsEarned;
      } else {
        userPointsMap.set(activity.userId, {
          userId: activity.userId,
          fullName: activity.fullName,
          avatarUrl: activity.avatarUrl,
          totalPoints: activity.pointsEarned,
        });
      }
    });

    // Convert to array and sort
    return Array.from(userPointsMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((user, index) => ({
        ...user,
        currentRank: index + 1,
        gamesPlayed: 0,
        studySessions: 0,
      }));
  }, [allActivities, timePeriod]);

  const filteredUsers = useMemo(() => {
    let users = timeFilteredLeaderboard || leaderboardData || [];
    
    if (viewMode === "friends") {
      const friendIds = friends.map((f: any) => f.friendId || f.userId);
      users = users.filter(u => friendIds.includes(u.userId || u.id) || (u.userId || u.id) === user?.id);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter(u => 
        u.fullName.toLowerCase().includes(query)
      );
    }
    
    return users;
  }, [timeFilteredLeaderboard, leaderboardData, viewMode, searchQuery, friends, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayedUsers = filteredUsers.slice(0, displayLimit);
  const topUsers = displayedUsers.slice(0, 3);
  const otherUsers = displayedUsers.slice(3);
  const hasMore = filteredUsers.length > displayLimit;

  const currentUserEntry = leaderboardData?.find((u: any) => (u.userId || u.id) === user?.id);
  const currentUserRank = (leaderboardData?.findIndex((u: any) => (u.userId || u.id) === user?.id) ?? -1) + 1;

  const getPodiumConfig = (index: number) => {
    if (index === 0) return { 
      icon: Crown, 
      gradient: "from-yellow-400 to-yellow-600", 
      ring: "ring-yellow-500/30",
      height: "h-32", 
      label: "1st",
      glow: "shadow-yellow-500/20"
    };
    if (index === 1) return { 
      icon: Medal, 
      gradient: "from-gray-300 to-gray-500", 
      ring: "ring-gray-400/30",
      height: "h-24", 
      label: "2nd",
      glow: "shadow-gray-500/20"
    };
    return { 
      icon: Trophy, 
      gradient: "from-orange-400 to-orange-600", 
      ring: "ring-orange-500/30",
      height: "h-20", 
      label: "3rd",
      glow: "shadow-orange-500/20"
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="text-leaderboard-title">
            <Trophy className="h-10 w-10 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Compete with students worldwide and climb to the top!
          </p>
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-col gap-4 mb-8">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "global" | "friends")} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="global" data-testid="tab-global">
                <Globe className="h-4 w-4 mr-2" />
                Global
              </TabsTrigger>
              <TabsTrigger value="friends" data-testid="tab-friends">
                <Users className="h-4 w-4 mr-2" />
                Friends {friends.length > 0 && `(${friends.length})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="md:w-48" data-testid="select-time-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current User Position (if not in top 3) */}
        {currentUserEntry && currentUserRank > 3 && (
          <Card className="mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl">
                    #{currentUserRank}
                  </div>
                  <div>
                    <p className="font-bold text-lg">Your Current Rank</p>
                    <p className="text-sm text-muted-foreground">
                      {(currentUserEntry.totalPoints || currentUserEntry.points || 0).toLocaleString()} points
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground">You</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Podium Display - Top 3 */}
        {topUsers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Top Champions
              </CardTitle>
              <CardDescription>The best of the best</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Reorder for podium effect: 2nd, 1st, 3rd */}
                {[1, 0, 2].map((originalIndex) => {
                  if (!topUsers[originalIndex]) return null;
                  
                  const userData = topUsers[originalIndex];
                  const rank = originalIndex + 1;
                  const podium = getPodiumConfig(originalIndex);
                  const isCurrentUser = (userData.userId || userData.id) === user?.id;
                  const points = userData.totalPoints || userData.points || 0;

                  return (
                    <div
                      key={userData.userId || userData.id}
                      className={cn(
                        "flex flex-col items-center text-center space-y-4",
                        originalIndex === 0 && "md:order-2"
                      )}
                      data-testid={`podium-${rank}`}
                    >
                      {/* Avatar with Icon Badge */}
                      <div className="relative">
                        <div className={cn(
                          "absolute inset-0 rounded-full bg-gradient-to-br opacity-20 blur-xl",
                          podium.gradient
                        )} />
                        <Avatar className={cn(
                          "h-20 w-20 border-4 border-background relative ring-4",
                          podium.ring
                        )}>
                          <AvatarImage src={userData.avatarUrl || undefined} />
                          <AvatarFallback className={cn(
                            "text-2xl font-bold bg-gradient-to-br text-white",
                            podium.gradient
                          )}>
                            {userData.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full p-2 bg-gradient-to-br shadow-lg",
                          podium.gradient,
                          podium.glow
                        )}>
                          <podium.icon className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <p className="font-bold text-lg">{userData.fullName}</p>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="mt-1">You</Badge>
                        )}
                      </div>

                      {/* Podium Block */}
                      <div className={cn(
                        "w-full rounded-lg p-4 bg-gradient-to-br flex flex-col items-center justify-center transition-all shadow-lg",
                        podium.gradient,
                        podium.height,
                        podium.glow
                      )}>
                        <p className="text-sm font-semibold text-white/90 mb-1">{podium.label} Place</p>
                        <p className="text-3xl font-bold text-white">
                          {points.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/80">points</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs w-full">
                        <div className="bg-muted/30 rounded-md p-2">
                          <Trophy className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                          <p className="font-semibold">{userData.gamesPlayed || 0}</p>
                          <p className="text-muted-foreground text-[10px]">Games</p>
                        </div>
                        <div className="bg-muted/30 rounded-md p-2">
                          <Clock className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                          <p className="font-semibold">{userData.studySessions || 0}</p>
                          <p className="text-muted-foreground text-[10px]">Sessions</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rankings List */}
        {otherUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rankings
              </CardTitle>
              <CardDescription>
                Showing {displayedUsers.length} of {filteredUsers.length} players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {otherUsers.map((userData, index) => {
                  const rank = index + 4;
                  const isCurrentUser = (userData.userId || userData.id) === user?.id;
                  const points = userData.totalPoints || userData.points || 0;

                  return (
                    <div
                      key={userData.userId || userData.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg hover-elevate transition-all",
                        isCurrentUser 
                          ? "bg-primary/10 border border-primary/20" 
                          : "bg-muted/30"
                      )}
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      {/* Rank Badge */}
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg",
                        isCurrentUser 
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/50 text-foreground"
                      )}>
                        #{rank}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userData.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {userData.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {userData.fullName}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {userData.gamesPlayed || 0} games
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {userData.studySessions || 0} sessions
                          </span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary font-mono">
                          {points.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(limit => limit + 20)}
                    data-testid="button-load-more"
                  >
                    Load More
                  </Button>
                </div>
              )}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No users found matching your search" : 
                    viewMode === "friends" ? "No friends to display. Add friends to see them here!" :
                    "No users to display"}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Keep Climbing!</h2>
              <p className="text-muted-foreground">
                Play games, complete study sessions, and earn points to rise through the ranks!
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="lg" data-testid="button-play-games">
                  <Trophy className="h-4 w-4 mr-2" />
                  Play Games
                </Button>
                <Button variant="outline" size="lg" data-testid="button-study">
                  <Award className="h-4 w-4 mr-2" />
                  Study Materials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
