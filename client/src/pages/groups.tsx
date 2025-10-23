import { useState, useRef, useEffect } from "react";
import { Users, Plus, Lock, Globe, TrendingUp, Trophy, Calendar, Target, UserPlus, LogOut, Crown, Search, Loader2, Award, MessageCircle, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useGroups, useUserGroups, useGroup, useGroupMembers, useGroupLeaderboard, useGroupActivities, useCreateGroup, useJoinGroup, useLeaveGroup, useGroupMessages, useSendGroupMessage } from "@/lib/api-hooks";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Groups() {
  const { user } = useAuth();
  const { data: allGroups = [], isLoading: groupsLoading } = useGroups();
  const { data: userGroups = [], isLoading: userGroupsLoading } = useUserGroups(user?.id);
  const { toast } = useToast();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const selectedGroup = useGroup(selectedGroupId);
  const groupMembers = useGroupMembers(selectedGroupId);
  const groupLeaderboard = useGroupLeaderboard(selectedGroupId);
  const groupActivities = useGroupActivities(selectedGroupId);
  const groupMessages = useGroupMessages(selectedGroupId);
  const sendMessage = useSendGroupMessage();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCreateGroup = async () => {
    if (!user) return;

    if (groupForm.name.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Group name must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGroup.mutateAsync({
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        ownerId: user.id,
        isPublic: groupForm.isPublic,
      });
      toast({
        title: "Group created",
        description: "Your study group has been created successfully!",
      });
      setIsCreateDialogOpen(false);
      setGroupForm({ name: "", description: "", isPublic: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await joinGroup.mutateAsync({ groupId, userId: user.id });
      toast({
        title: "Joined group",
        description: "You have successfully joined the group!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await leaveGroup.mutateAsync({ groupId, userId: user.id });
      toast({
        title: "Left group",
        description: "You have left the group",
      });
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedGroupId || !newMessage.trim()) return;

    try {
      await sendMessage.mutateAsync({
        groupId: selectedGroupId,
        userId: user.id,
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages.data]);

  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isUserInGroup = (groupId: string) => {
    return userGroups.some(g => g.groupId === groupId || g.id === groupId);
  };

  if (groupsLoading || userGroupsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If a group is selected, show group details
  if (selectedGroupId && selectedGroup.data) {
    const group = selectedGroup.data;
    const members = groupMembers.data || [];
    const leaderboard = groupLeaderboard.data || [];
    const activities = groupActivities.data || [];
    const isOwner = group.ownerId === user?.id;
    const isMember = isUserInGroup(selectedGroupId);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedGroupId(null)}
            className="mb-6"
            data-testid="button-back-to-groups"
          >
            ← Back to Groups
          </Button>

          {/* Group Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{group.name}</h1>
                      {group.isPublic ? (
                        <Badge variant="secondary" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      )}
                      {isOwner && (
                        <Badge className="bg-yellow-500 text-white gap-1">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{group.description || "No description"}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {members.length} members
                      </span>
                      <span>
                        Created {format(new Date(group.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {isMember ? (
                    <Button
                      variant="outline"
                      onClick={() => handleLeaveGroup(selectedGroupId)}
                      disabled={leaveGroup.isPending}
                      data-testid="button-leave-group"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Group
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleJoinGroup(selectedGroupId)}
                      disabled={joinGroup.isPending}
                      data-testid="button-join-group"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="leaderboard" data-testid="tab-group-leaderboard">
                <TrendingUp className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="members" data-testid="tab-group-members">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="chat" data-testid="tab-group-chat" disabled={!isMember}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-group-activity">
                <Calendar className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Group Leaderboard
                  </CardTitle>
                  <CardDescription>Top performers in this group</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leaderboard data yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry: any, index: number) => (
                        <div
                          key={entry.userId}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover-elevate"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50 font-bold">
                            #{index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={entry.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {entry.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{entry.fullName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary font-mono">
                              {entry.totalPoints.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Members
                  </CardTitle>
                  <CardDescription>{members.length} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {members.map((member: any) => (
                      <Card key={member.userId} className="hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{member.fullName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                                {member.userId === group.ownerId && (
                                  <Badge className="bg-yellow-500 text-white text-xs gap-1">
                                    <Crown className="h-3 w-3" />
                                    Owner
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Group Chat
                  </CardTitle>
                  <CardDescription>Chat with group members</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {!groupMessages.data || groupMessages.data.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {groupMessages.data.map((msg: any) => {
                          const isOwnMessage = msg.userId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-3",
                                isOwnMessage && "flex-row-reverse"
                              )}
                              data-testid={`message-${msg.id}`}
                            >
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={msg.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {msg.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwnMessage && "items-end")}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {isOwnMessage ? "You" : msg.fullName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(msg.createdAt), "h:mm a")}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "rounded-lg px-4 py-2",
                                    isOwnMessage
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  )}
                                >
                                  <p className="text-sm break-words">{msg.message}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={sendMessage.isPending}
                        data-testid="input-chat-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Group Activity
                  </CardTitle>
                  <CardDescription>Recent activities from group members</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity: any) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activity.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {activity.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm">
                                <span className="font-semibold">{activity.fullName}</span>{" "}
                                {activity.activityTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.timestamp), "MMM dd, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            +{activity.pointsEarned} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Main groups list view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="text-groups-title">
              <Users className="h-10 w-10 text-primary" />
              Study Groups
            </h1>
            <p className="text-muted-foreground">
              Join groups, compete with classmates, and learn together!
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-group">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-groups"
          />
        </div>

        <Tabs defaultValue="my-groups" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-groups" data-testid="tab-my-groups">
              My Groups ({userGroups.length})
            </TabsTrigger>
            <TabsTrigger value="all-groups" data-testid="tab-all-groups">
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="space-y-4">
            {userGroups.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create or join a study group to start collaborating!
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userGroups.map((group: any) => (
                  <Card
                    key={group.groupId || group.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedGroupId(group.groupId || group.id)}
                    data-testid={`group-card-${group.groupId || group.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                          {group.groupName?.charAt(0) || group.name?.charAt(0)}
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          {group.isPublic ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{group.groupName || group.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {group.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.memberCount || 0} members
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-groups" className="space-y-4">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or create a new group
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group: any) => {
                  const isMember = isUserInGroup(group.id);
                  
                  return (
                    <Card
                      key={group.id}
                      className="hover-elevate"
                      data-testid={`discover-group-${group.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                            {group.name.charAt(0)}
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            {group.isPublic ? (
                              <>
                                <Globe className="h-3 w-3" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                Private
                              </>
                            )}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group.memberCount || 0} members
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedGroupId(group.id)}
                          data-testid={`button-view-${group.id}`}
                        >
                          View Details
                        </Button>
                        {!isMember && (
                          <Button
                            className="flex-1"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={joinGroup.isPending}
                            data-testid={`button-join-${group.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        )}
                        {isMember && (
                          <Badge className="flex-1 justify-center bg-primary text-primary-foreground">
                            Member
                          </Badge>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-none">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Learn Better Together!</h2>
              <p className="text-muted-foreground">
                Study groups help you stay motivated, compete with friends, and achieve your learning goals faster.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-group">
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
            <DialogDescription>
              Start a new study group and invite your classmates!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., Math Study Group"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Describe your study group..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                data-testid="input-group-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-public">Public Group</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can discover and join this group
                </p>
              </div>
              <Switch
                id="is-public"
                checked={groupForm.isPublic}
                onCheckedChange={(checked) => setGroupForm({ ...groupForm, isPublic: checked })}
                data-testid="switch-is-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={createGroup.isPending}
              data-testid="button-submit-create"
            >
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
