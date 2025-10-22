import { useState } from "react";
import { User, Award, Trophy, TrendingUp, Calendar, Settings, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useAchievements, useActivities, useUpdateProfile } from "@/lib/api-hooks";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements(user?.id);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(user?.id);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  if (!user) {
    return null;
  }

  const handleEditProfile = () => {
    setEditedName(user.fullName);
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editedName.trim();
    
    if (trimmedName.length === 0) {
      toast({
        title: "Validation Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        fullName: trimmedName,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const stats = [
    { label: "Total Points", value: user.points.toLocaleString(), icon: Trophy },
    { label: "Global Rank", value: user.rank ? `#${user.rank}` : "Unranked", icon: TrendingUp },
    { label: "Activities", value: activities.length.toString(), icon: Calendar },
    { label: "Achievements", value: achievements.length.toString(), icon: Award },
  ];

  const groupedActivities = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.timestamp), "MMM dd, yyyy");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, typeof activities>);

  const activityDays = Object.entries(groupedActivities).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  data-testid="button-change-avatar"
                  disabled
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-1" data-testid="text-profile-name">
                      {user.fullName}
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="outline" onClick={handleEditProfile} data-testid="button-edit-profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">
                    Member since {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </Badge>
                  {user.rank && (
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                      Rank #{user.rank}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/30"
                      data-testid={`stat-${index}`}
                    >
                      <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="achievements" data-testid="tab-achievements">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              Activity History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  {achievements.length} achievements unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading achievements...</div>
                ) : achievements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No achievements yet. Start playing games and studying to unlock achievements!
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        className="hover-elevate transition-all duration-200 bg-gradient-to-br from-primary/5 to-secondary/5"
                        data-testid={`achievement-${achievement.id}`}
                      >
                        <CardContent className="p-6 text-center space-y-3">
                          <div className="text-5xl">
                            {achievement.badgeIcon}
                          </div>
                          <div>
                            <h3 className="font-bold mb-1">{achievement.badgeName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {achievement.badgeDescription}
                            </p>
                          </div>
                          <Badge variant="secondary" className="w-full justify-center">
                            Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
                ) : activityDays.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities yet. Start playing games or studying to see your activity!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityDays.map(([date, dayActivities]) => (
                      <div key={date} data-testid={`activity-day-${date}`}>
                        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                          {date}
                        </h3>
                        <div className="space-y-2 ml-4 border-l-2 border-muted pl-4">
                          {dayActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                            >
                              <div>
                                <p className="font-medium">{activity.activityTitle}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge variant="secondary" className="font-mono">
                                +{activity.pointsEarned} pts
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                data-testid="input-edit-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
              data-testid="button-save-profile"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
