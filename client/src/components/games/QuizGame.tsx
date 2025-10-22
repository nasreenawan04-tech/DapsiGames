import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Clock } from "lucide-react";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizGameProps {
  questions: QuizQuestion[];
  timeLimit?: number;
  onComplete: (score: number, timeElapsed: number) => void;
  onExit: () => void;
}

export function QuizGame({ questions, timeLimit, onComplete, onExit }: QuizGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
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

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || showExplanation) return;

    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleFinishGame();
    }
  };

  const handleFinishGame = () => {
    if (isFinished) return;
    setIsFinished(true);
    const finalScore = Math.round((score / questions.length) * 100);
    onComplete(finalScore, timeElapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isFinished) {
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle data-testid="text-game-complete">Quiz Complete!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-primary" data-testid="text-final-score">{finalScore}%</div>
            <p className="text-muted-foreground">
              You answered {score} out of {questions.length} questions correctly
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

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span data-testid="text-timer">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-quiz" />
        <CardDescription className="mt-4 text-lg font-semibold text-foreground" data-testid="text-question">
          {question.question}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const showCorrect = showExplanation && isCorrectAnswer;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <Button
                key={index}
                variant={showCorrect ? "default" : showIncorrect ? "destructive" : "outline"}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(index)}
                disabled={showExplanation}
                data-testid={`button-option-${index}`}
              >
                <span className="flex-1">{option}</span>
                {showCorrect && <Check className="w-5 h-5 ml-2" />}
                {showIncorrect && <X className="w-5 h-5 ml-2" />}
              </Button>
            );
          })}
        </div>

        {showExplanation && question.explanation && (
          <Card className={isCorrect ? "border-primary" : "border-destructive"}>
            <CardContent className="pt-4">
              <p className="text-sm" data-testid="text-explanation">{question.explanation}</p>
            </CardContent>
          </Card>
        )}

        {showExplanation && (
          <div className="flex gap-2">
            <Button onClick={handleNext} className="flex-1" data-testid="button-next">
              {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
            <Button variant="outline" onClick={onExit} data-testid="button-exit-game">
              Exit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
