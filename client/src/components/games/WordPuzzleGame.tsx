import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Lightbulb, Trophy, Star, Target, RefreshCw } from "lucide-react";

export interface WordPuzzle {
  word: string;
  hint: string;
  definition: string;
}

export interface WordPuzzleGameProps {
  puzzles: WordPuzzle[];
  timeLimit?: number;
  onComplete: (score: number, timeElapsed: number) => void;
  onExit: () => void;
}

export function WordPuzzleGame({ puzzles, timeLimit, onComplete, onExit }: WordPuzzleGameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) return;

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
  }, [isFinished, timeLimit]);

  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult) return;

    const correct = userAnswer.toLowerCase().trim() === puzzles[currentPuzzle].word.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentPuzzle < puzzles.length - 1) {
      setCurrentPuzzle(prev => prev + 1);
      setUserAnswer("");
      setShowHint(false);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      handleFinishGame();
    }
  };

  const handleFinishGame = () => {
    if (isFinished) return;
    setIsFinished(true);
    const finalScore = Math.round((score / puzzles.length) * 100);
    onComplete(finalScore, timeElapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScrambledWord = (word: string) => {
    const chars = word.split("");
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  };

  const progress = ((currentPuzzle + 1) / puzzles.length) * 100;

  if (isFinished) {
    const finalScore = Math.round((score / puzzles.length) * 100);
    const pointsEarned = score * 10;
    
    const getPerformanceGrade = () => {
      if (finalScore === 100) return { grade: "A+", color: "text-green-500", message: "Perfect! You're a word master!" };
      if (finalScore >= 90) return { grade: "A", color: "text-green-500", message: "Excellent work!" };
      if (finalScore >= 80) return { grade: "B+", color: "text-blue-500", message: "Great job!" };
      if (finalScore >= 70) return { grade: "B", color: "text-blue-500", message: "Well done!" };
      if (finalScore >= 60) return { grade: "C+", color: "text-yellow-500", message: "Good effort!" };
      return { grade: "C", color: "text-orange-500", message: "Keep practicing!" };
    };
    
    const performanceGrade = getPerformanceGrade();
    const avgTimePerPuzzle = Math.floor(timeElapsed / puzzles.length);
    
    const handlePlayAgain = () => {
      window.location.reload();
    };
    
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <CardHeader className="text-center relative pb-6">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-2xl ring-8 ring-primary/20 animate-pulse">
              <Trophy className="w-12 h-12 text-white drop-shadow-2xl" />
            </div>
          </div>
          <CardTitle className="text-4xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-extrabold" data-testid="text-game-complete">
            Puzzle Complete!
          </CardTitle>
          <CardDescription className="text-lg">Great job! Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          {/* Main score */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/15 shadow-2xl border-2 border-primary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <p className="text-sm text-muted-foreground mb-3 font-semibold tracking-wide relative z-10">FINAL SCORE</p>
            <div className="text-7xl font-extrabold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4 drop-shadow-2xl relative z-10" data-testid="text-final-score">
              {finalScore}%
            </div>
            <div className="flex gap-2 justify-center items-center mb-2 relative z-10">
              <Badge className="shadow-xl border-2 border-white/20 bg-green-500/20 text-green-600 dark:text-green-400" data-testid="badge-points">
                +{pointsEarned} Points Earned
              </Badge>
              <Badge className={`shadow-xl border-2 border-white/20 text-xl px-4 py-1 ${performanceGrade.color}`} data-testid="badge-grade">
                Grade: {performanceGrade.grade}
              </Badge>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-5">
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/15 to-green-500/5 border-2 border-green-500/30 text-center hover-elevate transition-all shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-6 h-6 text-green-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Correct</p>
              </div>
              <p className="text-4xl font-extrabold text-green-500 drop-shadow-lg" data-testid="text-correct">{score}/{puzzles.length}</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-2 border-blue-500/30 text-center hover-elevate transition-all shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-blue-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Total Time</p>
              </div>
              <p className="text-3xl font-extrabold text-blue-500 drop-shadow-lg" data-testid="text-time">{formatTime(timeElapsed)}</p>
            </div>
          </div>

          {/* Performance message */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 border-2 border-primary/30 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              {finalScore === 100 ? <Trophy className="w-6 h-6 text-yellow-500" /> :
               finalScore >= 90 ? <Star className="w-6 h-6 text-yellow-500" /> :
               <Target className="w-6 h-6 text-green-500" />}
              <p className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {performanceGrade.message}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Average {formatTime(avgTimePerPuzzle)} per puzzle
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onExit} 
              className="flex-1" 
              data-testid="button-exit"
            >
              Exit Game
            </Button>
            <Button 
              onClick={handlePlayAgain}
              className="flex-1 gap-2" 
              data-testid="button-play-again"
            >
              <RefreshCw className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const puzzle = puzzles[currentPuzzle];
  const scrambled = getScrambledWord(puzzle.word);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-medium">
            Puzzle {currentPuzzle + 1} of {puzzles.length}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span data-testid="text-timer">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-puzzle" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Unscramble the letters:</p>
            <p className="text-3xl font-bold tracking-wider" data-testid="text-scrambled">{scrambled}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Definition:</p>
            <p className="text-base" data-testid="text-definition">{puzzle.definition}</p>
          </div>

          {showHint && (
            <Card className="border-primary">
              <CardContent className="pt-4">
                <p className="text-sm" data-testid="text-hint">
                  <strong>Hint:</strong> {puzzle.hint}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer here..."
            disabled={showResult}
            className="text-center text-lg"
            data-testid="input-answer"
          />

          {showResult && (
            <Card className={isCorrect ? "border-primary" : "border-destructive"}>
              <CardContent className="pt-4 text-center">
                <p className="text-lg font-semibold" data-testid="text-result">
                  {isCorrect ? "Correct!" : `The answer was: ${puzzle.word}`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-2">
          {!showResult ? (
            <>
              <Button onClick={handleSubmit} className="flex-1" disabled={!userAnswer.trim()} data-testid="button-submit">
                Submit Answer
              </Button>
              <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint} data-testid="button-hint">
                <Lightbulb className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} className="flex-1" data-testid="button-next">
              {currentPuzzle < puzzles.length - 1 ? "Next Puzzle" : "Finish Game"}
            </Button>
          )}
          <Button variant="outline" onClick={onExit} data-testid="button-exit-game">
            Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
