import { useState } from "react";
import { BookOpen, Search, Filter, Clock, Target, Loader2 } from "lucide-react";
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
import { useAuth } from "@/lib/auth";
import { useStudyMaterials, useCompleteStudyMaterial } from "@/lib/api-hooks";
import { useToast } from "@/hooks/use-toast";

export default function Study() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: materials, isLoading } = useStudyMaterials();
  const completeStudyMutation = useCompleteStudyMaterial();
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set());

  const handleCompleteMaterial = async (materialId: string, materialTitle: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to earn points",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await completeStudyMutation.mutateAsync({
        materialId,
        userId: user.id,
      });

      setCompletedMaterials((prev) => new Set(prev).add(materialId));

      toast({
        title: "Great job!",
        description: `You earned ${result.pointsEarned} points for completing "${materialTitle}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete study material",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subjects = materials || [];

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

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: "bg-primary/10 text-primary",
      Physics: "bg-secondary/10 text-secondary",
      Geography: "bg-accent/10 text-accent",
      Chemistry: "bg-info/10 text-info",
      Literature: "bg-chart-4/10 text-chart-4",
    };
    return colors[subject] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-study-title">
            <BookOpen className="h-8 w-8 text-primary" />
            Study Materials
          </h1>
          <p className="text-muted-foreground">
            Explore our comprehensive library of educational content
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study materials..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="md:w-48" data-testid="select-subject">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
              <SelectItem value="literature">Literature</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((material) => {
            const isCompleted = completedMaterials.has(material.id);
            return (
              <Card
                key={material.id}
                className="hover-elevate transition-all duration-200 flex flex-col"
                data-testid={`study-card-${material.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getSubjectColor(material.subject)}>
                      {material.subject}
                    </Badge>
                    <Badge className={getDifficultyColor(material.difficulty)}>
                      {material.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <CardDescription>{material.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span className="font-mono">+{material.pointsReward} pts</span>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="mt-4">
                      <Badge className="bg-success text-success-foreground">
                        Completed
                      </Badge>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCompleted ? "outline" : "default"}
                    onClick={() => handleCompleteMaterial(material.id, material.title)}
                    disabled={completeStudyMutation.isPending || isCompleted}
                    data-testid={`button-study-${material.id}`}
                  >
                    {completeStudyMutation.isPending
                      ? "Completing..."
                      : isCompleted
                      ? "Completed"
                      : "Complete Material"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
