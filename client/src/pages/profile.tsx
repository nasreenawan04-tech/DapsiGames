import { useState, useRef } from "react";
import { User, Award, Trophy, TrendingUp, Calendar, Settings, Camera, Users, UserPlus, Check, X, Search, Flame, Target } from "lucide-react";
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
import { useAchievements, useActivities, useUpdateProfile, useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useSearchUsers, useStreak } from "@/lib/api-hooks";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { FriendSearchModal } from "@/components/FriendSearchModal";


export default function Profile() {
  const { user } = useAuth();
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements(user?.id);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(user?.id);
  const { data: friends = [], isLoading: friendsLoading } = useFriends(user?.id);
  const { data: friendRequests = [], isLoading: requestsLoading } = useFriendRequests(user?.id);
  const { data: streak } = useStreak(user?.id);
  const updateProfile = useUpdateProfile();
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [] } = useSearchUsers(searchQuery);
  const [showFriendSearch, setShowFriendSearch] = useState(false);


  if (!user) {
    return null;
  }

  const handleEditProfile = () => {
    setEditedName(user.fullName);
    setIsEditDialogOpen(true);
  };

  const handleChangeAvatar = () => {
    setAvatarUrl(user.avatarUrl || "");
    setIsAvatarDialogOpen(true);
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

  const handleSaveAvatar = async () => {
    const trimmedUrl = avatarUrl.trim();

    if (trimmedUrl.length > 0) {
      try {
        new URL(trimmedUrl);
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        avatarUrl: trimmedUrl,
      });
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
      setIsAvatarDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive",
      });
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      await sendRequest.mutateAsync({ userId: user.id, friendId });
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      setSearchQuery("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await acceptRequest.mutateAsync(friendshipId);
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await rejectRequest.mutateAsync(friendshipId);
      toast({
        title: "Friend request rejected",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await removeFriend.mutateAsync(friendshipId);
      toast({
        title: "Friend removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const stats = [
    { label: "Total Points", value: user.points?.toLocaleString() || "0", icon: Trophy },
    { label: "Global Rank", value: user.rank ? `#${user.rank}` : "Unranked", icon: TrendingUp },
    { label: "Friends", value: friends.length.toString(), icon: Users },
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
                  onClick={handleChangeAvatar}
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
                    Member since {format(new Date(), "MMM dd, yyyy")}
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

        {streak && (
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                    <Flame className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                    <p className="text-3xl font-bold">
                      {streak.currentStreak} <span className="text-lg text-muted-foreground">days</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-primary to-secondary">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
                    <p className="text-3xl font-bold">
                      {streak.longestStreak} <span className="text-lg text-muted-foreground">days</span>
                    </p>
                  </div>
                </div>
              </div>
              {streak.lastStudyDate && (
                <div className="mt-4 pt-4 border-t border-orange-500/20">
                  <p className="text-sm text-muted-foreground">
                    Last active: {formatDistanceToNow(new Date(streak.lastStudyDate), { addSuffix: true })}
                  </p>
                </div>
              )}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress to next milestone</span>
                  <span className="font-semibold">{streak.currentStreak % 7}/7 days</span>
                </div>
                <Progress value={(streak.currentStreak % 7) * 14.28} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="achievements" data-testid="tab-achievements">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">
              Friends
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              Activity
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

          <TabsContent value="friends" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Your Friends
                    </CardTitle>
                    <CardDescription>
                      {friends.length} friends
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowFriendSearch(true)} data-testid="button-add-friend">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {friendRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                      Friend Requests ({friendRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {friendRequests.map((request: any) => (
                        <div
                          key={request.friendshipId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                          data-testid={`friend-request-${request.friendshipId}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={request.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {request.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{request.fullName}</p>
                              <p className="text-sm text-muted-foreground">{request.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="default"
                              onClick={() => handleAcceptRequest(request.friendshipId)}
                              data-testid={`button-accept-${request.friendshipId}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.friendshipId)}
                              data-testid={`button-reject-${request.friendshipId}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {friendsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No friends yet. Add some friends to start competing!
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {friends.map((friend: any) => (
                      <Card
                        key={friend.friendshipId}
                        className="hover-elevate"
                        data-testid={`friend-card-${friend.friendshipId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={friend.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {friend.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{friend.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {friend.points.toLocaleString()} points
                                </p>
                                {friend.rank && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Rank #{friend.rank}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFriend(friend.friendshipId)}
                              data-testid={`button-remove-${friend.friendshipId}`}
                            >
                              Remove
                            </Button>
                          </div>
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

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent data-testid="dialog-change-avatar">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
            <DialogDescription>
              Enter a URL for your profile picture. You can use image hosting services like Gravatar or Imgur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Image URL</Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                data-testid="input-avatar-url"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to remove your profile picture
              </p>
            </div>
            {avatarUrl && (
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAvatarDialogOpen(false)}
              data-testid="button-cancel-avatar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAvatar}
              disabled={updateProfile.isPending}
              data-testid="button-save-avatar"
            >
              {updateProfile.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FriendSearchModal
        isOpen={showFriendSearch}
        onClose={() => setShowFriendSearch(false)}
        onAddFriend={handleAddFriend}
        currentUserId={user.id}
      />
    </div>
    </>
  );
}