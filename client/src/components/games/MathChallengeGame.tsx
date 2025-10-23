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
    const incorrectAnswers = numberOfQuestions - score;
    const avgPointsPerQuestion = Math.round(totalPoints / numberOfQuestions);
    const timePerQuestion = Math.round(timeElapsed / numberOfQuestions);
    
    // Calculate performance grade
    const getGrade = () => {
      if (accuracy === 100) return { letter: "S", color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10" };
      if (accuracy >= 95) return { letter: "A+", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" };
      if (accuracy >= 90) return { letter: "A", color: "text-green-400", bg: "from-green-500/20 to-green-600/10" };
      if (accuracy >= 85) return { letter: "B+", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10" };
      if (accuracy >= 80) return { letter: "B", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10" };
      if (accuracy >= 75) return { letter: "C+", color: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-600/10" };
      if (accuracy >= 70) return { letter: "C", color: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-600/10" };
      return { letter: "D", color: "text-orange-400", bg: "from-orange-500/20 to-orange-600/10" };
    };
    
    const grade = getGrade();
    
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-2 overflow-hidden relative animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        
        {/* Animated confetti effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <CardHeader className="text-center relative pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-2xl ring-8 ring-primary/20 relative animate-bounce-slow">
                <Trophy className="w-14 h-14 text-white drop-shadow-2xl" />
              </div>
            </div>
          </div>
          <CardTitle className="text-5xl mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent font-extrabold animate-in slide-in-from-bottom duration-700" data-testid="text-game-complete">
            Challenge Complete!
          </CardTitle>
          <CardDescription className="text-lg">Here's your detailed performance breakdown</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 relative">
          {/* Grade and Main Score Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Grade */}
            <div className={`text-center p-8 rounded-2xl bg-gradient-to-br ${grade.bg} shadow-2xl border-2 border-primary/30 relative overflow-hidden animate-in zoom-in duration-500`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <p className="text-sm text-muted-foreground mb-3 font-semibold tracking-wide relative z-10">PERFORMANCE GRADE</p>
              <div className={`text-8xl font-black ${grade.color} mb-3 drop-shadow-2xl relative z-10 font-mono`}>
                {grade.letter}
              </div>
              <Badge className="shadow-xl border-2 border-white/20 relative z-10 text-base px-4 py-1">
                {accuracy}% Accuracy
              </Badge>
            </div>
            
            {/* Total Points */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/15 shadow-2xl border-2 border-primary/30 relative overflow-hidden animate-in zoom-in duration-500 delay-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <p className="text-sm text-muted-foreground mb-3 font-semibold tracking-wide relative z-10">TOTAL POINTS EARNED</p>
              <div className="text-7xl font-extrabold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-3 drop-shadow-2xl animate-pulse relative z-10" data-testid="text-final-score">
                {totalPoints.toLocaleString()}
              </div>
              <Badge variant="outline" className="shadow-lg border-2 relative z-10">
                Avg: {avgPointsPerQuestion} pts/question
              </Badge>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              Detailed Statistics
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Correct Answers */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/15 to-green-500/5 border-2 border-green-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-left duration-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-500 drop-shadow-lg" />
                  <p className="text-xs text-muted-foreground font-semibold">Correct</p>
                </div>
                <p className="text-3xl font-extrabold text-green-500 drop-shadow-lg">{score}</p>
                <p className="text-xs text-muted-foreground mt-1">of {numberOfQuestions}</p>
              </div>
              
              {/* Incorrect Answers */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/15 to-red-500/5 border-2 border-red-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-left duration-500 delay-75">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <X className="w-5 h-5 text-red-500 drop-shadow-lg" />
                  <p className="text-xs text-muted-foreground font-semibold">Incorrect</p>
                </div>
                <p className="text-3xl font-extrabold text-red-500 drop-shadow-lg">{incorrectAnswers}</p>
                <p className="text-xs text-muted-foreground mt-1">mistakes</p>
              </div>
              
              {/* Best Streak */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-2 border-orange-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-right duration-500 delay-150">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500 drop-shadow-lg" />
                  <p className="text-xs text-muted-foreground font-semibold">Best Streak</p>
                </div>
                <p className="text-3xl font-extrabold text-orange-500 drop-shadow-lg">{maxStreak}</p>
                <p className="text-xs text-muted-foreground mt-1">in a row</p>
              </div>
              
              {/* Perfect Streak */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-2 border-purple-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-right duration-500 delay-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-purple-500 drop-shadow-lg" />
                  <p className="text-xs text-muted-foreground font-semibold">Final Streak</p>
                </div>
                <p className="text-3xl font-extrabold text-purple-500 drop-shadow-lg">{streak}</p>
                <p className="text-xs text-muted-foreground mt-1">at finish</p>
              </div>
            </div>
          </div>

          {/* Time Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-2 border-blue-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Total Time</p>
              </div>
              <p className="text-3xl font-extrabold text-blue-500 drop-shadow-lg">{formatTime(timeElapsed)}</p>
            </div>
            
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border-2 border-cyan-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-bottom duration-500 delay-75">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-cyan-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Avg per Question</p>
              </div>
              <p className="text-3xl font-extrabold text-cyan-500 drop-shadow-lg">{timePerQuestion}s</p>
            </div>
            
            <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 border-2 border-yellow-500/30 text-center hover-elevate transition-all shadow-lg animate-in slide-in-from-bottom duration-500 delay-150">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Speed Rating</p>
              </div>
              <p className="text-3xl font-extrabold text-yellow-500 drop-shadow-lg">
                {timePerQuestion < 5 ? "⚡" : timePerQuestion < 8 ? "🔥" : timePerQuestion < 12 ? "✨" : "🐢"}
              </p>
            </div>
          </div>

          {/* Performance Message */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 border-2 border-primary/30 shadow-lg animate-in zoom-in duration-500 delay-300">
            <div className="flex items-center justify-center gap-3 mb-3">
              {accuracy === 100 ? <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" /> :
               accuracy >= 90 ? <Star className="w-8 h-8 text-yellow-500 animate-pulse" /> :
               accuracy >= 75 ? <Target className="w-8 h-8 text-green-500 animate-pulse" /> :
               accuracy >= 60 ? <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" /> :
               <Zap className="w-8 h-8 text-orange-500 animate-pulse" />}
            </div>
            <p className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {accuracy === 100 ? "🎉 PERFECT SCORE! 🎉" :
               accuracy >= 90 ? "⭐ Excellent Work!" :
               accuracy >= 75 ? "🎯 Great Job!" :
               accuracy >= 60 ? "✨ Good Effort!" :
               "💪 Keep Practicing!"}
            </p>
            <p className="text-muted-foreground text-sm">
              {accuracy === 100 ? "You're a math genius! Flawless performance!" :
               accuracy >= 90 ? "Almost perfect! You're on fire!" :
               accuracy >= 75 ? "Solid performance! Keep it up!" :
               accuracy >= 60 ? "You're making progress!" :
               "Practice makes perfect! Try again!"}
            </p>
          </div>

          <Button 
            onClick={onExit} 
            className="w-full text-lg shadow-2xl bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-all font-bold animate-in slide-in-from-bottom duration-500 delay-500" 
            data-testid="button-exit"
            size="lg"
          >
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

      <Card className={`w-full max-w-2xl mx-auto transition-all duration-300 shadow-2xl border-2 overflow-hidden relative ${
        shakeAnimation ? 'animate-shake' : ''
      } ${pulseAnimation ? 'scale-[1.02]' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="shadow-md">
                Question {currentProblem + 1}/{numberOfQuestions}
              </Badge>
              <Badge className="font-mono bg-gradient-to-r from-primary to-secondary shadow-md">
                {totalPoints.toLocaleString()} pts
              </Badge>
              {streak >= 3 && (
                <Badge className={`${showComboAnimation ? 'animate-bounce scale-110' : ''} bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg text-white border-2 border-white/20`}>
                  {getStreakIcon()}
                  <span className="ml-1 font-bold">{streak}x Streak!</span>
                </Badge>
              )}
            </div>
            {timeLimit && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining <= 10 
                  ? "bg-destructive/20 text-destructive animate-pulse border-2 border-destructive" 
                  : "bg-muted text-muted-foreground"
              } font-mono font-bold text-sm shadow-md`}>
                <Clock className="w-4 h-4" />
                <span data-testid="text-timer">{timeRemaining}s</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-3 transition-all duration-500 shadow-inner" data-testid="progress-math" />
        </CardHeader>
        
        <CardContent className="space-y-6 relative">
          {/* Problem display */}
          <div className="text-center space-y-5 p-10 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 shadow-lg border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="flex items-center justify-center gap-3 relative z-10">
              <Sparkles className="w-6 h-6 text-primary animate-pulse drop-shadow-lg" />
              <p className="text-base text-muted-foreground font-semibold tracking-wide">SOLVE THIS</p>
              <Sparkles className="w-6 h-6 text-primary animate-pulse drop-shadow-lg" />
            </div>
            <p className={`text-7xl font-extrabold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent transition-all duration-300 drop-shadow-2xl relative z-10 ${
              showResult && isCorrect ? 'scale-110 animate-pulse' : ''
            }`} data-testid="text-problem">
              {problem.question} = ?
            </p>
            {comboMultiplier > 1 && (
              <Badge className="text-xl px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse shadow-2xl border-2 border-white/30 relative z-10">
                <Zap className="w-5 h-5 mr-2 inline" />
                {comboMultiplier}x Multiplier Active!
              </Badge>
            )}
          </div>

          {/* Answer input */}
          <div className="space-y-4">
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
              className="text-center text-3xl font-extrabold transition-all duration-200 shadow-2xl border-2 focus:border-primary rounded-xl px-6 py-8"
              data-testid="input-answer"
              autoFocus
            />

            {showResult && (
              <Card className={`border-3 transition-all duration-300 transform shadow-2xl ${
                isCorrect 
                  ? "border-green-500 bg-gradient-to-br from-green-500/20 to-green-500/10 scale-105" 
                  : "border-red-500 bg-gradient-to-br from-red-500/20 to-red-500/10"
              }`}>
                <CardContent className="pt-6 text-center space-y-3">
                  <p className="text-3xl font-extrabold drop-shadow-lg" data-testid="text-result">
                    {isCorrect ? "✓ Correct!" : `✗ Wrong! Answer: ${problem.answer}`}
                  </p>
                  {isCorrect && (
                    <div className="space-y-2">
                      <p className="text-2xl text-green-600 dark:text-green-400 font-bold animate-pulse drop-shadow-lg">
                        +{lastPointsEarned} points
                      </p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {lastAnswerSpeed < 3000 && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg border-2 border-white/20">
                            <Zap className="w-4 h-4 mr-1 inline" />
                            Lightning Fast!
                          </Badge>
                        )}
                        {streak > 0 && streak % 5 === 0 && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg animate-bounce border-2 border-white/20">
                            <Flame className="w-4 h-4 mr-1 inline" />
                            {streak} Streak Bonus!
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground font-semibold mt-3 px-4 py-2 rounded-full bg-muted/50 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isCorrect ? "Auto-advancing in 1s..." : "Auto-advancing in 2s..."}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {!showResult ? (
              <Button 
                onClick={handleSubmit} 
                className="flex-1 text-lg shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary to-secondary font-bold" 
                disabled={!userAnswer.trim()} 
                data-testid="button-submit"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Submit Answer (or press Enter)
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                className="flex-1 text-lg shadow-xl bg-gradient-to-r from-primary to-secondary font-bold transition-all" 
                data-testid="button-next"
                size="lg"
              >
                {currentProblem < numberOfQuestions - 1 ? "Next Problem" : "Finish Challenge"}
                <Trophy className="h-5 w-5 ml-2" />
              </Button>
            )}
            <Button variant="outline" onClick={onExit} data-testid="button-exit-game" className="shadow-lg" size="lg">
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
        
        @keyframes float {
          0% { 
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
