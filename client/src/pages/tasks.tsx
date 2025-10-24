import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, Filter, Search, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";
import { format } from "date-fns";
import confetti from "canvas-confetti";

const CATEGORIES = ["study", "homework", "reading", "practice"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

export default function Tasks() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("study");
  const [priority, setPriority] = useState<string>("medium");
  const [deadline, setDeadline] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-3" data-testid="text-tasks-guest">
                Task Manager
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                Create an account to manage your tasks, set deadlines, track progress, and earn XP for completing your goals!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button size="lg" data-testid="button-signup-tasks">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" data-testid="button-login-tasks">
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

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${user?.id}`],
    enabled: !!user,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      return await apiRequest<Task>("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Your task has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiRequest<Task & { xpEarned: number }>("PATCH", `/api/tasks/${taskId}/complete`);
    },
    onSuccess: (data) => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      toast({
        title: "Task Completed!",
        description: `You earned ${data.xpEarned} XP!`,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${user?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
      return await apiRequest<Task>("PATCH", `/api/tasks/${taskId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Your task has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "Task has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      userId: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      xpReward: priority === "high" ? 30 : priority === "medium" ? 20 : 10,
      bonusXp: deadline ? 10 : 0,
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setPriority(task.priority);
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    updateTaskMutation.mutate({
      taskId: editingTask.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("study");
    setPriority("medium");
    setDeadline("");
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPriority && matchesSearch;
  });

  const incompleteTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-accent";
      case "low":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "destructive" | "secondary" => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-tasks-title">
              Tasks & Goals
            </h1>
            <p className="text-muted-foreground">
              Organize your study tasks and earn XP for completing them
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your study goals. Earn bonus XP for early completion!
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete algebra homework"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-task-title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add details about this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="input-task-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-task-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger data-testid="select-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    data-testid="input-task-deadline"
                  />
                  {deadline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete before deadline to earn +10 bonus XP!
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  data-testid="button-submit-task"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Update your task details. Changes will be saved immediately.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Complete algebra homework"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-edit-task-title"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Add details about this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="input-edit-task-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-edit-task-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger data-testid="select-edit-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-deadline">Deadline (Optional)</Label>
                  <Input
                    id="edit-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    data-testid="input-edit-task-deadline"
                  />
                  {deadline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete before deadline to earn +10 bonus XP!
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTask}
                  disabled={updateTaskMutation.isPending}
                  data-testid="button-update-task"
                >
                  {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-tasks"
                  />
                </div>
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-category">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-priority">
                  <Flag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold" data-testid="text-active-tasks">
                    {incompleteTasks.length}
                  </p>
                </div>
                <Circle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold" data-testid="text-completed-tasks">
                    {completedTasks.length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP Available</p>
                  <p className="text-2xl font-bold" data-testid="text-total-xp">
                    {incompleteTasks.reduce((sum, task) => sum + task.xpReward + task.bonusXp, 0)}
                  </p>
                </div>
                <Flag className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Lists */}
        <div className="space-y-6">
          {/* Active Tasks */}
          {incompleteTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Tasks you're currently working on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incompleteTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover-elevate"
                      data-testid={`task-${index}`}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="mt-1"
                        onClick={() => completeTaskMutation.mutate(task.id)}
                        disabled={completeTaskMutation.isPending}
                        data-testid={`button-complete-task-${index}`}
                      >
                        <Circle className="h-5 w-5" />
                      </Button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                                <Flag className={`mr-1 h-3 w-3 ${getPriorityColor(task.priority)}`} />
                                {task.priority}
                              </Badge>
                              <Badge variant="outline">{task.category}</Badge>
                              {task.deadline && (
                                <Badge variant="secondary">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {format(new Date(task.deadline), "MMM d, h:mm a")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="font-mono">
                              +{task.xpReward + task.bonusXp} XP
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditTask(task)}
                              data-testid={`button-edit-task-${index}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              disabled={deleteTaskMutation.isPending}
                              data-testid={`button-delete-task-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>Well done! Keep up the great work!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 opacity-75"
                      data-testid={`completed-task-${index}`}
                    >
                      <CheckCircle2 className="h-5 w-5 text-success mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium line-through">{task.title}</h3>
                        {task.completedAt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Completed {format(new Date(task.completedAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">Loading tasks...</p>
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first task!
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">
                  No tasks match your current filters
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
