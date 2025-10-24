import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Timer, Play, Pause, RotateCcw, Trophy, Flame, Clock, Music, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { StudySession, Streak } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";

const DURATION_OPTIONS = [
  { value: 25, label: "25 minutes", xp: 250 },
  { value: 45, label: "45 minutes", xp: 450 },
  { value: 60, label: "60 minutes", xp: 600 },
];

const AMBIENT_SOUNDS = [
  { value: "silence", label: "Silence", icon: VolumeX },
  { value: "forest", label: "Forest", icon: Music },
  { value: "rain", label: "Rain", icon: Music },
  { value: "cafe", label: "Café", icon: Volume2 },
];

export default function Pomodoro() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedSound, setSelectedSound] = useState("silence");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
            <CardContent className="p-8 text-center">
              <Timer className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-3" data-testid="text-pomodoro-guest">
                Pomodoro Focus Timer
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                Create an account to use the Pomodoro timer, track your study sessions, earn XP, and maintain your streak!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button size="lg" data-testid="button-signup-pomodoro">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" data-testid="button-login-pomodoro">
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch user's streak
  const { data: streak } = useQuery<Streak>({
    queryKey: [`/api/streaks/${user?.id}`],
    enabled: !!user,
  });

  // Fetch recent study sessions
  const { data: sessions = [] } = useQuery<StudySession[]>({
    queryKey: [`/api/study-sessions/${user?.id}`],
    enabled: !!user,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { userId: string; duration: number; ambientSound: string }) => {
      return await apiRequest<StudySession>("POST", "/api/study-sessions", data);
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start study session",
        variant: "destructive",
      });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest<StudySession>("PATCH", `/api/study-sessions/${sessionId}/complete`);
    },
    onSuccess: (data) => {
      // Show success animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "Session Complete!",
        description: `You earned ${data.xpEarned} XP! Keep up the great work!`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/study-sessions/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/streaks/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${user?.id}`] });

      setCurrentSessionId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    if (!user) return;

    setIsRunning(true);
    setTimeRemaining(selectedDuration * 60);

    // Create session in backend
    createSessionMutation.mutate({
      userId: user.id,
      duration: selectedDuration,
      ambientSound: selectedSound,
    });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(selectedDuration * 60);
    setCurrentSessionId(null);
  };

  const handleSessionComplete = () => {
    if (currentSessionId) {
      completeSessionMutation.mutate(currentSessionId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;

  const selectedDurationOption = DURATION_OPTIONS.find((opt) => opt.value === selectedDuration);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-pomodoro-title">
            Pomodoro Timer
          </h1>
          <p className="text-muted-foreground">
            Focus on your studies and earn XP with each session
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Timer */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center">
                  {/* Circular Progress */}
                  <div className="relative w-64 h-64 mb-8">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 120}`}
                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Timer className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-5xl font-bold" data-testid="text-timer-display">
                        {formatTime(timeRemaining)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedDurationOption?.xp} XP
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-4 mb-6">
                    {!isRunning ? (
                      <Button
                        size="lg"
                        onClick={handleStart}
                        disabled={timeRemaining === 0}
                        data-testid="button-start-timer"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Start
                      </Button>
                    ) : (
                      <Button size="lg" variant="secondary" onClick={handlePause} data-testid="button-pause-timer">
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </Button>
                    )}
                    <Button size="lg" variant="outline" onClick={handleReset} data-testid="button-reset-timer">
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Reset
                    </Button>
                  </div>

                  {/* Settings */}
                  <div className="w-full max-w-md space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration</label>
                      <Select
                        value={selectedDuration.toString()}
                        onValueChange={(value) => {
                          const duration = parseInt(value);
                          setSelectedDuration(duration);
                          if (!isRunning) {
                            setTimeRemaining(duration * 60);
                          }
                        }}
                        disabled={isRunning}
                      >
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label} ({option.xp} XP)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Ambient Sound</label>
                      <Select value={selectedSound} onValueChange={setSelectedSound} disabled={isRunning}>
                        <SelectTrigger data-testid="select-ambient-sound">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AMBIENT_SOUNDS.map((sound) => (
                            <SelectItem key={sound.value} value={sound.value}>
                              <div className="flex items-center gap-2">
                                <sound.icon className="h-4 w-4" />
                                {sound.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent" />
                  Study Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-4xl font-bold" data-testid="text-current-streak">
                    {streak?.currentStreak || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Longest Streak: <span className="font-bold">{streak?.longestStreak || 0} days</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Your last {sessions.length} sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions yet. Start your first one!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session, index) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        data-testid={`session-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            session.completed ? "bg-success/10" : "bg-muted"
                          }`}>
                            <Timer className={`h-4 w-4 ${
                              session.completed ? "text-success" : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{session.duration} minutes</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {session.completed && (
                          <Badge variant="secondary" className="font-mono">
                            +{session.xpEarned} XP
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary mt-1" />
                  <div className="space-y-1">
                    <h3 className="font-bold">Pro Tip</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete a study session daily to maintain your streak and earn bonus XP!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
