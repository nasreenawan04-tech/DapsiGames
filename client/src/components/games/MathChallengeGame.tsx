import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy } from "lucide-react";

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

  const generateProblems = () => {
    const newProblems: MathProblem[] = [];
    const operators: Array<"+" | "-" | "*" | "/"> = difficulty === "easy" ? ["+", "-"] : difficulty === "medium" ? ["+", "-", "*"] : ["+", "-", "*", "/"];

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
          num2 = Math.floor(Math.random() * 20) + 1;
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
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult || problems.length === 0) return;

    const userAnswerNum = parseFloat(userAnswer);
    const correct = Math.abs(userAnswerNum - problems[currentProblem].answer) < 0.01;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(prev => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
    } else {
      handleFinishGame();
    }
  };

  const handleFinishGame = () => {
    if (isFinished) return;
    setIsFinished(true);
    const finalScore = Math.round((score / numberOfQuestions) * 100);
    onComplete(finalScore, timeElapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((currentProblem + 1) / numberOfQuestions) * 100;

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
    const finalScore = Math.round((score / numberOfQuestions) * 100);
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle data-testid="text-game-complete">Challenge Complete!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <Trophy className="w-16 h-16 mx-auto text-primary" />
            <div className="text-6xl font-bold text-primary" data-testid="text-final-score">{finalScore}%</div>
            <p className="text-muted-foreground">
              You solved {score} out of {numberOfQuestions} problems correctly
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

  const problem = problems[currentProblem];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-medium">
            Problem {currentProblem + 1} of {numberOfQuestions}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span data-testid="text-timer">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-math" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Solve the problem:</p>
          <p className="text-5xl font-bold" data-testid="text-problem">{problem.question} = ?</p>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter your answer..."
            disabled={showResult}
            className="text-center text-2xl h-16"
            data-testid="input-answer"
          />

          {showResult && (
            <Card className={isCorrect ? "border-primary" : "border-destructive"}>
              <CardContent className="pt-4 text-center">
                <p className="text-lg font-semibold" data-testid="text-result">
                  {isCorrect ? "Correct!" : `The answer was: ${problem.answer}`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-2">
          {!showResult ? (
            <Button onClick={handleSubmit} className="flex-1" disabled={!userAnswer.trim()} data-testid="button-submit">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1" data-testid="button-next">
              {currentProblem < numberOfQuestions - 1 ? "Next Problem" : "Finish Challenge"}
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
