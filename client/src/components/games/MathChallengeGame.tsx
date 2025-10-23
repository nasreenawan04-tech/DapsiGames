import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, Flame, Zap, Star, Target, Sparkles } from "lucide-react";

export type Difficulty = "easy" | "medium" | "hard";

export interface MathChallengeGameProps {
  difficulty: Difficulty;
  numberOfQuestions: number;
  timeLimit?: number;
  onComplete: (score: number, timeElapsed: number) => void;
  onExit: () => void;
}

interface MathProblem {
  num1: number;
  num2: number;
  operator: "+" | "-" | "*" | "/";
  answer: number;
  question: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  life: number;
}

export function MathChallengeGame({
  difficulty,
  numberOfQuestions,
  timeLimit,
  onComplete,
  onExit,
}: MathChallengeGameProps) {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  
  // Addictive features
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [lastAnswerSpeed, setLastAnswerSpeed] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  
  // New addictive features
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for frequently changing values to avoid recreating effects
  const totalPointsRef = useRef(totalPoints);
  const timeElapsedRef = useRef(timeElapsed);
  
  // Keep refs in sync with state
  useEffect(() => {
    totalPointsRef.current = totalPoints;
  }, [totalPoints]);
  
  useEffect(() => {
    timeElapsedRef.current = timeElapsed;
  }, [timeElapsed]);

  // Memoized handlers to prevent effect recreation
  const handleFinishGame = useCallback(() => {
    setIsFinished(prev => {
      if (prev) return prev;
      onComplete(totalPointsRef.current, timeElapsedRef.current);
      return true;
    });
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(prev => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setProblemStartTime(Date.now());
      
      // Focus input for next question
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      handleFinishGame();
    }
  }, [currentProblem, problems.length, handleFinishGame]);

  useEffect(() => {
    generateProblems();
  }, [difficulty, numberOfQuestions]);

  useEffect(() => {
    if (isFinished || problems.length === 0) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (timeLimit && newTime >= timeLimit) {
          handleFinishGame();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, timeLimit, problems.length]);

  // Auto-advance to next question after showing result
  useEffect(() => {
    if (!showResult) return;
    
    // Clear any existing timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    
    // Auto-advance after 1.2 seconds for correct, 2 seconds for incorrect
    const delay = isCorrect ? 1200 : 2000;
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      handleNext();
    }, delay);

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [showResult, isCorrect, handleNext]);

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            velocityY: p.velocityY + 0.5, // gravity
            life: p.life - 1,
          }))
          .filter(p => p.life > 0)
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles]);

  const generateProblems = () => {
    const newProblems: MathProblem[] = [];
    const operators: Array<"+" | "-" | "*" | "/"> = 
      difficulty === "easy" ? ["+", "-"] : 
      difficulty === "medium" ? ["+", "-", "*"] : 
      ["+", "-", "*", "/"];

    for (let i = 0; i < numberOfQuestions; i++) {
      const operator = operators[Math.floor(Math.random() * operators.length)];
      let num1: number, num2: number, answer: number;

      switch (difficulty) {
        case "easy":
          num1 = Math.floor(Math.random() * 20) + 1;
          num2 = Math.floor(Math.random() * 20) + 1;
          break;
        case "medium":
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 30) + 1;
          break;
        case "hard":
          num1 = Math.floor(Math.random() * 100) + 1;
          num2 = Math.floor(Math.random() * 50) + 1;
          break;
      }

      switch (operator) {
        case "+":
          answer = num1 + num2;
          break;
        case "-":
          if (num2 > num1) [num1, num2] = [num2, num1];
          answer = num1 - num2;
          break;
        case "*":
          answer = num1 * num2;
          break;
        case "/":
          answer = num1;
          num1 = answer * num2;
          break;
      }

      newProblems.push({
        num1,
        num2,
        operator,
        answer,
        question: `${num1} ${operator} ${num2}`,
      });
    }

    setProblems(newProblems);
    setProblemStartTime(Date.now());
  };

  const createParticles = (isCorrectAnswer: boolean) => {
    const colors = isCorrectAnswer 
      ? ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#fcd34d'] 
      : ['#ef4444', '#f87171', '#fca5a5'];
    
    const newParticles: Particle[] = [];
    const particleCount = isCorrectAnswer ? 30 : 15;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        velocityX: (Math.random() - 0.5) * 15,
        velocityY: (Math.random() - 0.5) * 15 - 5,
        life: 60,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult || problems.length === 0) return;

    const timeSpent = Date.now() - problemStartTime;
    const userAnswerNum = parseFloat(userAnswer);
    const correct = Math.abs(userAnswerNum - problems[currentProblem].answer) < 0.01;
    
    setIsCorrect(correct);
    setShowResult(true);
    setLastAnswerSpeed(timeSpent);

    // Trigger animations
    if (correct) {
      createParticles(true);
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 600);
    } else {
      createParticles(false);
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
    }

    if (correct) {
      // Calculate new streak and multiplier BEFORE calculating points
      const newStreak = streak + 1;
      let newMultiplier = comboMultiplier;
      
      if (newStreak >= 10) {
        newMultiplier = 3;
      } else if (newStreak >= 5) {
        newMultiplier = 2;
      } else if (newStreak >= 3) {
        newMultiplier = 1.5;
      } else {
        newMultiplier = 1;
      }

      // Calculate points with the NEW multiplier
      let points = 100;
      const speedBonus = Math.max(0, 50 - Math.floor(timeSpent / 100));
      points += speedBonus;
      const streakBonus = Math.floor(newStreak * 10);
      points += streakBonus;
      points = Math.floor(points * newMultiplier);
      
      // Update state
      setScore(prev => prev + 1);
      setTotalPoints(prev => prev + points);
      setStreak(newStreak);
      setComboMultiplier(newMultiplier);
      setPerfectStreak(prev => prev + 1);
      setLastPointsEarned(points);
      
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      // Show combo animation for streaks
      if (newStreak >= 3) {
        setShowComboAnimation(true);
        setTimeout(() => setShowComboAnimation(false), 1000);
      }
    } else {
      // Reset streak on wrong answer
      setStreak(0);
      setComboMultiplier(1);
      setPerfectStreak(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStreakColor = () => {
    if (streak >= 10) return "text-purple-500";
    if (streak >= 5) return "text-orange-500";
    if (streak >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getStreakIcon = () => {
    if (streak >= 10) return <Zap className="w-5 h-5 text-purple-500" />;
    if (streak >= 5) return <Flame className="w-5 h-5 text-orange-500" />;
    if (streak >= 3) return <Star className="w-5 h-5 text-yellow-500" />;
    return null;
  };

  const progress = ((currentProblem + 1) / numberOfQuestions) * 100;
  const timeRemaining = timeLimit ? timeLimit - timeElapsed : 0;

  if (problems.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <p>Loading problems...</p>
        </CardContent>
      </Card>
    );
  }

  if (isFinished) {
    const accuracy = Math.round((score / numberOfQuestions) * 100);
    const avgSpeed = score > 0 ? formatTime(Math.floor(timeElapsed / score)) : "N/A";
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle data-testid="text-game-complete">Challenge Complete!</CardTitle>
          <CardDescription>Amazing work! Here's your breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main score */}
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Points</p>
            <div className="text-6xl font-bold text-primary mb-2 animate-pulse" data-testid="text-final-score">
              {totalPoints.toLocaleString()}
            </div>
            <Badge className="text-lg px-4 py-1">
              {accuracy}% Accuracy
            </Badge>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center hover-elevate transition-all">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <p className="text-sm text-muted-foreground">Best Streak</p>
              </div>
              <p className="text-3xl font-bold text-orange-500">{maxStreak}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center hover-elevate transition-all">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <p className="text-3xl font-bold text-green-500">{score}/{numberOfQuestions}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center hover-elevate transition-all">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
              <p className="text-2xl font-bold text-blue-500">{formatTime(timeElapsed)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center hover-elevate transition-all">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Avg Speed</p>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{avgSpeed}</p>
            </div>
          </div>

          {/* Performance message */}
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <p className="font-semibold text-lg">
              {accuracy === 100 ? "Perfect Score! You're a math genius!" :
               accuracy >= 90 ? "Excellent! Almost perfect!" :
               accuracy >= 75 ? "Great job! Keep it up!" :
               accuracy >= 60 ? "Good effort! Practice makes perfect!" :
               "Keep practicing! You'll get there!"}
            </p>
          </div>

          <Button onClick={onExit} className="w-full" data-testid="button-exit" size="lg">
            Return to Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  const problem = problems[currentProblem];

  return (
    <div className="relative">
      {/* Particle system */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life / 60,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            }}
          />
        ))}
      </div>

      <Card className={`w-full max-w-2xl mx-auto transition-all duration-300 ${
        shakeAnimation ? 'animate-shake' : ''
      } ${pulseAnimation ? 'scale-[1.02]' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-sm">
                {currentProblem + 1}/{numberOfQuestions}
              </Badge>
              <Badge variant="secondary" className="font-mono text-sm">
                {totalPoints.toLocaleString()} pts
              </Badge>
              {streak >= 3 && (
                <Badge className={`${showComboAnimation ? 'animate-bounce' : ''} bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg`}>
                  {getStreakIcon()}
                  <span className="ml-1">{streak}x Streak!</span>
                </Badge>
              )}
            </div>
            {timeLimit && (
              <div className={`flex items-center gap-2 text-sm font-mono font-bold ${
                timeRemaining <= 10 ? "text-destructive animate-pulse" : "text-muted-foreground"
              }`}>
                <Clock className="w-4 h-4" />
                <span data-testid="text-timer">{timeRemaining}s</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2 transition-all duration-500" data-testid="progress-math" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Problem display */}
          <div className="text-center space-y-4 p-8 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 shadow-inner">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground font-medium">Solve this:</p>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <p className={`text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent transition-all duration-300 ${
              showResult && isCorrect ? 'scale-110' : ''
            }`} data-testid="text-problem">
              {problem.question} = ?
            </p>
            {comboMultiplier > 1 && (
              <Badge className="text-lg bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse shadow-lg">
                {comboMultiplier}x Multiplier Active!
              </Badge>
            )}
          </div>

          {/* Answer input */}
          <div className="space-y-3">
            <Input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !showResult) {
                  handleSubmit();
                }
              }}
              placeholder="Type your answer..."
              disabled={showResult}
              className="text-center text-3xl h-20 font-bold transition-all duration-200 focus:scale-105 shadow-lg"
              data-testid="input-answer"
              autoFocus
            />

            {showResult && (
              <Card className={`border-2 transition-all duration-300 transform ${
                isCorrect 
                  ? "border-green-500 bg-green-500/10 scale-105" 
                  : "border-red-500 bg-red-500/10"
              }`}>
                <CardContent className="pt-4 text-center space-y-2">
                  <p className="text-2xl font-bold" data-testid="text-result">
                    {isCorrect ? "✓ Correct!" : `✗ Wrong! Answer: ${problem.answer}`}
                  </p>
                  {isCorrect && (
                    <div className="space-y-1">
                      <p className="text-lg text-green-600 dark:text-green-400 font-semibold animate-pulse">
                        +{lastPointsEarned} points
                      </p>
                      {lastAnswerSpeed < 3000 && (
                        <Badge className="bg-yellow-500 shadow-md">⚡ Lightning Fast!</Badge>
                      )}
                      {streak > 0 && streak % 5 === 0 && (
                        <Badge className="bg-purple-500 shadow-md animate-bounce">🔥 {streak} Streak Bonus!</Badge>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {isCorrect ? "Auto-advancing in 1s..." : "Auto-advancing in 2s..."}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!showResult ? (
              <Button 
                onClick={handleSubmit} 
                className="flex-1 h-12 text-lg shadow-lg hover:shadow-xl transition-all" 
                disabled={!userAnswer.trim()} 
                data-testid="button-submit"
              >
                Submit Answer (or press Enter)
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                className="flex-1 h-12 text-lg shadow-lg" 
                data-testid="button-next"
              >
                {currentProblem < numberOfQuestions - 1 ? "Next Problem →" : "Finish Challenge 🏆"}
              </Button>
            )}
            <Button variant="outline" onClick={onExit} data-testid="button-exit-game" className="shadow">
              Exit
            </Button>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
