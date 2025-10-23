import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Trophy, X, Play, RotateCcw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { useCompleteGame, useGame } from "@/lib/api-hooks";
import { useToast } from "@/hooks/use-toast";
import { MathChallengeGame, type Difficulty } from "@/components/games/MathChallengeGame";

export default function GamePlay() {
  const [, params] = useRoute("/games/:gameId");
  const gameId = params?.gameId;
  const { user } = useAuth();
  const { toast } = useToast();
  const completeGameMutation = useCompleteGame();
  const { data: gameData, isLoading: gameLoading } = useGame(gameId);

  const [gameState, setGameState] = useState<"intro" | "playing" | "finished">("intro");
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");

  // Temporary inline questions - these should eventually be in the database
  const gameQuestions: Record<string, any> = {
    "math-quiz": [
      {
        question: "What is 15 × 8?",
        answers: ["110", "120", "130", "140"],
        correct: 1,
      },
      {
        question: "Solve: (12 + 8) ÷ 4 = ?",
        answers: ["3", "4", "5", "6"],
        correct: 2,
      },
      {
        question: "What is the square root of 144?",
        answers: ["10", "11", "12", "13"],
        correct: 2,
      },
    ],
    "science-trivia": [
      {
        question: "What is the chemical symbol for gold?",
        answers: ["Go", "Gd", "Au", "Ag"],
        correct: 2,
      },
      {
        question: "Which planet is known as the Red Planet?",
        answers: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: 1,
      },
    ],
    "geography-quest": [
      {
        question: "What is the capital of France?",
        answers: ["London", "Berlin", "Paris", "Madrid"],
        correct: 2,
      },
      {
        question: "Which is the largest ocean?",
        answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correct: 3,
      },
    ],
  };

  const game = gameData && gameId ? {
    ...gameData,
    questions: gameQuestions[gameId] || []
  } : null;

  useEffect(() => {
    // Skip timer for math-quiz as MathChallengeGame handles its own timing
    if (gameId === "math-quiz") return;
    
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === "playing") {
      handleAnswer(null);
    }
  }, [timeLeft, gameState, gameId]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCurrentQuestion(0);
    setTimeLeft(30);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (answerIndex !== null && answerIndex === game?.questions[currentQuestion].correct) {
      const points = Math.floor((timeLeft / 30) * 100);
      setScore(score + points);
    }

    if (currentQuestion < game?.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
      }, 1000);
    } else {
      setTimeout(async () => {
        setGameState("finished");
        
        if (user && gameId) {
          try {
            const result = await completeGameMutation.mutateAsync({
              gameId,
              userId: user.id,
              score: score + (answerIndex !== null && answerIndex === game?.questions[currentQuestion].correct ? Math.floor((timeLeft / 30) * 100) : 0),
            });
            
            setPointsEarned(result.pointsEarned);
            
            toast({
              title: "Game Complete!",
              description: `You earned ${result.pointsEarned} points!`,
            });
          } catch (error: any) {
            toast({
              title: "Error",
              description: "Failed to save your score",
              variant: "destructive",
            });
          }
        }
      }, 1000);
    }

    setSelectedAnswer(answerIndex);
  };

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game || !gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
            <Link href="/games">
              <Button>Back to Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game.questions || game.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
            <p className="text-muted-foreground mb-4">This game doesn't have questions set up yet.</p>
            <Link href="/games">
              <Button>Back to Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = game.questions[currentQuestion];

  // Handle Math Challenge Game separately
  const handleMathChallengeComplete = async (score: number, timeElapsed: number) => {
    setScore(score);
    setGameState("finished");
    
    if (user && gameId) {
      try {
        const result = await completeGameMutation.mutateAsync({
          gameId,
          userId: user.id,
          score,
        });
        
        setPointsEarned(result.pointsEarned);
        
        toast({
          title: "Game Complete!",
          description: `You earned ${result.pointsEarned} points!`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to save your score",
          variant: "destructive",
        });
      }
    }
  };

  const handleMathChallengeExit = () => {
    setGameState("intro");
  };

  // Use selected difficulty for math challenge
  const getNumberOfQuestions = () => {
    switch (selectedDifficulty) {
      case "easy": return 10;
      case "medium": return 15;
      case "hard": return 20;
      default: return 10;
    }
  };

  const getTimeLimit = () => {
    switch (selectedDifficulty) {
      case "easy": return 90;
      case "medium": return 120;
      case "hard": return 150;
      default: return 90;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Render Math Challenge Game for math-quiz */}
          {gameId === "math-quiz" && gameState === "playing" && (
            <MathChallengeGame
              difficulty={selectedDifficulty}
              numberOfQuestions={getNumberOfQuestions()}
              timeLimit={getTimeLimit()}
              onComplete={handleMathChallengeComplete}
              onExit={handleMathChallengeExit}
            />
          )}

          {/* Only show intro/finished for math-quiz, regular gameplay for others */}
          {(gameId !== "math-quiz" || gameState !== "playing") && gameState === "intro" && (
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2" data-testid="text-game-title">
                  {game.title}
                </CardTitle>
                <CardDescription className="text-base">
                  Answer questions correctly and quickly to maximize your score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Difficulty selection for Math Blitz */}
                {gameId === "math-quiz" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-3">Choose Your Challenge</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant={selectedDifficulty === "easy" ? "default" : "outline"}
                          onClick={() => setSelectedDifficulty("easy")}
                          className="h-auto py-4 flex flex-col items-center gap-2"
                          data-testid="button-difficulty-easy"
                        >
                          <span className="text-2xl">🌱</span>
                          <div>
                            <div className="font-bold">Easy</div>
                            <div className="text-xs opacity-75">10 problems</div>
                            <div className="text-xs opacity-75">90 seconds</div>
                          </div>
                        </Button>
                        <Button
                          variant={selectedDifficulty === "medium" ? "default" : "outline"}
                          onClick={() => setSelectedDifficulty("medium")}
                          className="h-auto py-4 flex flex-col items-center gap-2"
                          data-testid="button-difficulty-medium"
                        >
                          <span className="text-2xl">🔥</span>
                          <div>
                            <div className="font-bold">Medium</div>
                            <div className="text-xs opacity-75">15 problems</div>
                            <div className="text-xs opacity-75">120 seconds</div>
                          </div>
                        </Button>
                        <Button
                          variant={selectedDifficulty === "hard" ? "default" : "outline"}
                          onClick={() => setSelectedDifficulty("hard")}
                          className="h-auto py-4 flex flex-col items-center gap-2"
                          data-testid="button-difficulty-hard"
                        >
                          <span className="text-2xl">⚡</span>
                          <div>
                            <div className="font-bold">Hard</div>
                            <div className="text-xs opacity-75">20 problems</div>
                            <div className="text-xs opacity-75">150 seconds</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Standard game stats for non-math games */}
                {gameId !== "math-quiz" && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-primary">{game.questions.length}</p>
                      <p className="text-sm text-muted-foreground">Questions</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-secondary">30s</p>
                      <p className="text-sm text-muted-foreground">Per Question</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-accent">+{game.pointsReward}</p>
                      <p className="text-sm text-muted-foreground">Max Points</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold">How to Play:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {gameId === "math-quiz" ? (
                      <>
                        <li>• Solve arithmetic problems as fast as you can</li>
                        <li>• Build streaks for bonus points</li>
                        <li>• Speed matters - quick answers earn more</li>
                        <li>• Watch out for the timer!</li>
                      </>
                    ) : (
                      <>
                        <li>• Answer each question within the time limit</li>
                        <li>• Faster answers earn more points</li>
                        <li>• Wrong answers don't deduct points</li>
                        <li>• Complete all questions to finish the game</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link href="/games">
                    <a className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="button-back">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Games
                      </Button>
                    </a>
                  </Link>
                  <Button className="flex-1" onClick={startGame} data-testid="button-start">
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {gameId !== "math-quiz" && gameState === "playing" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Question {currentQuestion + 1}/{game.questions.length}
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      Score: {score}
                    </Badge>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${
                    timeLeft <= 5 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {timeLeft}s
                  </div>
                </div>
                <Progress value={(currentQuestion / game.questions.length) * 100} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-muted/30">
                  <h2 className="text-2xl font-bold text-center" data-testid="text-question">
                    {question.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.answers.map((answer: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`h-auto py-4 text-lg ${
                        selectedAnswer === index
                          ? index === question.correct
                            ? "bg-success/20 border-success hover:bg-success/30"
                            : "bg-destructive/20 border-destructive hover:bg-destructive/30"
                          : ""
                      }`}
                      onClick={() => selectedAnswer === null && handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      data-testid={`button-answer-${index}`}
                    >
                      {answer}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {gameState === "finished" && (
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">Game Complete!</CardTitle>
                <CardDescription>Great job! Here are your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  <p className="text-sm text-muted-foreground mb-2">Final Score</p>
                  <p className="text-5xl font-bold text-primary mb-4" data-testid="text-final-score">
                    {score}
                  </p>
                  <Badge className="bg-success text-success-foreground" data-testid="badge-points-earned">
                    +{pointsEarned || Math.floor((score / 300) * game.pointsReward)} Points Earned
                  </Badge>
                </div>

                <div className="flex gap-3">
                  <Link href="/games">
                    <a className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="button-exit">
                        Exit Game
                      </Button>
                    </a>
                  </Link>
                  <Button className="flex-1" onClick={startGame} data-testid="button-play-again">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
