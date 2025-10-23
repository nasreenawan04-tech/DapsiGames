import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Trophy, Star, Target, Zap, RefreshCw } from "lucide-react";

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
    const pointsEarned = score * 15;
    
    const getPerformanceGrade = () => {
      if (finalScore === 100) return { grade: "A+", color: "text-green-500", message: "Perfect! You aced it!" };
      if (finalScore >= 90) return { grade: "A", color: "text-green-500", message: "Excellent performance!" };
      if (finalScore >= 80) return { grade: "B+", color: "text-blue-500", message: "Great work!" };
      if (finalScore >= 70) return { grade: "B", color: "text-blue-500", message: "Nice job!" };
      if (finalScore >= 60) return { grade: "C+", color: "text-yellow-500", message: "Good effort!" };
      return { grade: "C", color: "text-orange-500", message: "Keep studying!" };
    };
    
    const performanceGrade = getPerformanceGrade();
    const avgTimePerQuestion = Math.floor(timeElapsed / questions.length);
    
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
            Quiz Complete!
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
                <p className="text-sm text-muted-foreground font-semibold">Accuracy</p>
              </div>
              <p className="text-4xl font-extrabold text-green-500 drop-shadow-lg" data-testid="text-accuracy">{score}/{questions.length}</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-2 border-blue-500/30 text-center hover-elevate transition-all shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-blue-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Total Time</p>
              </div>
              <p className="text-3xl font-extrabold text-blue-500 drop-shadow-lg" data-testid="text-time">{formatTime(timeElapsed)}</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-2 border-purple-500/30 text-center hover-elevate transition-all shadow-lg col-span-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-purple-500 drop-shadow-lg" />
                <p className="text-sm text-muted-foreground font-semibold">Average Time Per Question</p>
              </div>
              <p className="text-3xl font-extrabold text-purple-500 drop-shadow-lg" data-testid="text-avg-time">{formatTime(avgTimePerQuestion)}</p>
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
