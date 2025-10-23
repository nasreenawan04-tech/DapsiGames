
import { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  points: number;
}

interface FriendSearchModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function FriendSearchModal({ open, onClose, currentUserId }: FriendSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const users = await response.json();
      setSearchResults(users.filter((u: User) => u.id !== currentUserId));
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for users",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch(`/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, friendId }),
      });
      if (!response.ok) throw new Error("Failed to send friend request");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: "You'll be notified when they accept your request.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${currentUserId}/requests`] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Unable to send friend request. They may already be your friend.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for users by name or email to send a friend request
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                      <AvatarFallback>
                        {user.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.points} points</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest.mutate(user.id)}
                    disabled={sendFriendRequest.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
