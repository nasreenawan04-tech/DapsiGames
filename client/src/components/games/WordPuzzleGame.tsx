import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, Lightbulb } from "lucide-react";

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
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle data-testid="text-game-complete">Puzzle Complete!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-primary" data-testid="text-final-score">{finalScore}%</div>
            <p className="text-muted-foreground">
              You solved {score} out of {puzzles.length} puzzles correctly
            </p>
            <p className="text-sm text-muted-foreground">
              Time: {formatTime(timeElapsed)}
            </p>
          </div>
          <Button onClick={onExit} className="w-full" data-testid="button-exit">
            Return to Games
          </Button>
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
