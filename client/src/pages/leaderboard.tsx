import { useState, useMemo } from "react";
import { Trophy, Medal, Search, Loader2, Users, Globe } from "lucide-react";
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
import { useLeaderboard, useFriends } from "@/lib/api-hooks";
import { useAuth } from "@/lib/auth";

export default function Leaderboard() {
  const { data: leaderboardData, isLoading } = useLeaderboard();
  const { user } = useAuth();
  const { data: friends = [] } = useFriends(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"global" | "friends">("global");
  const [displayLimit, setDisplayLimit] = useState(20);

  const filteredUsers = useMemo(() => {
    let users = leaderboardData || [];
    
    if (viewMode === "friends") {
      const friendIds = friends.map((f: any) => f.userId);
      users = users.filter(u => friendIds.includes(u.id) || u.id === user?.id);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter(u => 
        u.fullName.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }
    
    return users;
  }, [leaderboardData, viewMode, searchQuery, friends, user?.id]);

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


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-leaderboard-title">
            <Trophy className="h-8 w-8 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See how you rank against other learners {viewMode === "friends" ? "and your friends" : "around the world"}
          </p>
        </div>

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
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
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
      </div>
    </div>
  );
}
