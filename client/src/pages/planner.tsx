import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Clock,
  Target,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, addWeeks, addMonths } from "date-fns";
import type { Task } from "@shared/schema";

type ViewMode = "week" | "month";

export default function Planner() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("study");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>("");

  // Fetch user tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", user?.id],
    enabled: !!user,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (!user) throw new Error("Not authenticated");
      const response = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", user?.id] });
      resetTaskForm();
      setIsAddTaskOpen(false);
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to complete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", user?.id] });
    },
  });

  const resetTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskCategory("study");
    setNewTaskPriority("medium");
    setNewTaskDeadline("");
    setSelectedDate(null);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle) return;

    const deadline = newTaskDeadline
      ? new Date(newTaskDeadline)
      : selectedDate
      ? selectedDate
      : undefined;

    createTaskMutation.mutate({
      userId: user?.id,
      title: newTaskTitle,
      description: newTaskDescription,
      category: newTaskCategory,
      priority: newTaskPriority,
      deadline: deadline?.toISOString(),
      xpReward: 10,
      bonusXp: newTaskPriority === "high" ? 5 : newTaskPriority === "medium" ? 2 : 0,
    });
  };

  const handleExportPDF = () => {
    // Simple PDF export using window.print
    window.print();
  };

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  };

  const { start, end } = getDateRange();

  // Generate days array
  const getDays = () => {
    const days = [];
    let currentDay = new Date(start);

    while (currentDay <= end) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }

    return days;
  };

  const days = getDays();

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, date);
    });
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const priorityColors = {
    low: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
    high: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
  };

  const categoryIcons = {
    study: Target,
    homework: Clock,
    reading: Calendar,
    practice: CheckCircle2,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-planner-title">
              Study Planner
            </h1>
            <p className="text-muted-foreground" data-testid="text-planner-subtitle">
              Plan your study sessions and track your tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-add-task">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your study planner
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Title</Label>
                    <Input
                      id="task-title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title"
                      data-testid="input-task-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Task description"
                      data-testid="input-task-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-category">Category</Label>
                      <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                        <SelectTrigger id="task-category" data-testid="select-task-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="study">Study</SelectItem>
                          <SelectItem value="homework">Homework</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="practice">Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                        <SelectTrigger id="task-priority" data-testid="select-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-deadline">Deadline</Label>
                    <Input
                      id="task-deadline"
                      type="datetime-local"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      data-testid="input-task-deadline"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!newTaskTitle || createTaskMutation.isPending}
                    data-testid="button-create-task"
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  data-testid="button-previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  data-testid="button-today"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  data-testid="button-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-lg font-semibold ml-4" data-testid="text-current-period">
                  {viewMode === "week"
                    ? `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
                    : format(currentDate, "MMMM yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  data-testid="button-view-week"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  data-testid="button-view-month"
                >
                  Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {viewMode === "week" && (
            <>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </>
          )}

          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                className={`${
                  isToday ? "border-primary border-2" : ""
                } hover-elevate`}
                data-testid={`card-day-${format(day, "yyyy-MM-dd")}`}
              >
                <CardHeader className="p-3 space-y-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {format(day, viewMode === "week" ? "d" : "d MMM")}
                    </CardTitle>
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  ) : (
                    dayTasks.map((task) => {
                      const CategoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || Circle;

                      return (
                        <div
                          key={task.id}
                          className={`p-2 rounded-md border ${
                            task.completed
                              ? "opacity-60 line-through"
                              : priorityColors[task.priority as keyof typeof priorityColors]
                          }`}
                          data-testid={`task-${task.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="h-3 w-3" />
                                <p className="text-xs font-medium truncate">
                                  {task.title}
                                </p>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            {!task.completed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => completeTaskMutation.mutate(task.id)}
                                data-testid={`button-complete-${task.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setSelectedDate(day);
                      setNewTaskDeadline(format(day, "yyyy-MM-dd'T'HH:mm"));
                      setIsAddTaskOpen(true);
                    }}
                    data-testid={`button-add-task-${format(day, "yyyy-MM-dd")}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Task Summary */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-summary-title">Task Summary</CardTitle>
            <CardDescription>Overview of your tasks for this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-tasks">
                  {tasks.filter((t) => {
                    if (!t.deadline) return false;
                    const taskDate = new Date(t.deadline);
                    return taskDate >= start && taskDate <= end;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="text-completed-tasks">
                  {tasks.filter((t) => {
                    if (!t.deadline) return false;
                    const taskDate = new Date(t.deadline);
                    return t.completed && taskDate >= start && taskDate <= end;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-tasks">
                  {tasks.filter((t) => {
                    if (!t.deadline) return false;
                    const taskDate = new Date(t.deadline);
                    return !t.completed && taskDate >= start && taskDate <= end;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600" data-testid="text-overdue-tasks">
                  {tasks.filter((t) => {
                    if (!t.deadline || t.completed) return false;
                    const taskDate = new Date(t.deadline);
                    return taskDate < new Date();
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
