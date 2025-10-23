import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Gamepad2, Search, Trophy, Target, Zap, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGames } from "@/lib/api-hooks";
import mathGameImg from "@assets/generated_images/Math_game_thumbnail_0b3725a5.png";
import scienceGameImg from "@assets/generated_images/Science_trivia_game_thumbnail_f43577c5.png";
import geographyGameImg from "@assets/generated_images/Geography_quiz_game_thumbnail_50c55091.png";

export default function Games() {
  const { data: gamesData, isLoading } = useGames();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Temporary thumbnail mapping until we have actual thumbnails in DB
  const thumbnails: Record<string, string> = {
    "Mathematics": mathGameImg,
    "Science": scienceGameImg,
    "Geography": geographyGameImg,
  };

  const filteredGames = useMemo(() => {
    if (!gamesData) return [];

    let filtered = gamesData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(g => g.category.toLowerCase() === categoryFilter);
    }

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(g => g.difficulty.toLowerCase() === difficultyFilter);
    }

    return filtered;
  }, [gamesData, searchQuery, categoryFilter, difficultyFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-success bg-success/10";
      case "Medium":
        return "text-warning bg-warning/10";
      case "Hard":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Mathematics: "bg-primary/10 text-primary",
      Science: "bg-secondary/10 text-secondary",
      Geography: "bg-accent/10 text-accent",
      Language: "bg-info/10 text-info",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-games-title">
            <Gamepad2 className="h-8 w-8 text-primary" />
            Educational Games
          </h1>
          <p className="text-muted-foreground">
            Learn while having fun with our collection of educational games and earn points!
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="md:w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
              <SelectItem value="language">Language</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="md:w-48" data-testid="select-difficulty">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredGames.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No games found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <Card
                key={game.id}
                className="hover-elevate transition-all duration-200 overflow-hidden flex flex-col"
                data-testid={`game-card-${game.id}`}
              >
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                  <img
                    src={thumbnails[game.category] || mathGameImg}
                    alt={game.title}
                    className="w-full h-full object-cover"
                    data-testid={`img-game-${game.id}`}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className={getDifficultyColor(game.difficulty)}>
                      {game.difficulty}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <div className="mb-2">
                    <Badge className={getCategoryColor(game.category)}>
                      {game.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Max Reward</span>
                      </div>
                      <span className="font-mono font-semibold text-primary">
                        +{game.pointsReward} pts
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Link href={`/games/${game.id}`} className="w-full">
                    <Button className="w-full" data-testid={`button-play-${game.id}`}>
                      <Zap className="h-4 w-4 mr-2" />
                      Play Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Challenge Yourself!</h2>
              <p className="text-muted-foreground">
                Complete games to earn points and climb the leaderboard. Each game rewards you based on your performance!
              </p>
              <Link href="/leaderboard">
                <Button size="lg" data-testid="button-view-leaderboard">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
