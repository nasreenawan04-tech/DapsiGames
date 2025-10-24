import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import type { User, Game, StudyMaterial, UserActivity, Bookmark } from "@shared/schema";

// Real-time websocket connection for leaderboard updates
let ws: WebSocket | null = null;
let wsAttempts = 0;
const MAX_WS_ATTEMPTS = 3;

export function connectWebSocket() {
  // Skip WebSocket in serverless/production environments where it's not supported
  if (typeof window === "undefined") return;
  if (ws?.readyState === WebSocket.OPEN) return;
  
  // Don't retry indefinitely if WebSocket is not available
  if (wsAttempts >= MAX_WS_ATTEMPTS) {
    console.log("WebSocket not available - using polling mode");
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  
  // Skip WebSocket if host is not properly set (serverless environment)
  if (!host || host.includes("undefined")) {
    console.log("WebSocket not available in this environment");
    return;
  }
  
  const wsUrl = `${protocol}//${host}/ws`;
  
  try {
    ws = new WebSocket(wsUrl);
    wsAttempts++;

    ws.onopen = () => {
      console.log("WebSocket connected");
      wsAttempts = 0; // Reset attempts on successful connection
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "leaderboard_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    };

    ws.onerror = (error) => {
      console.log("WebSocket connection failed - continuing without real-time updates");
    };

    ws.onclose = () => {
      ws = null;
      // Only retry if we haven't exceeded max attempts
      if (wsAttempts < MAX_WS_ATTEMPTS) {
        setTimeout(connectWebSocket, 5000);
      }
    };
  } catch (error) {
    console.log("WebSocket not supported in this environment");
    wsAttempts = MAX_WS_ATTEMPTS; // Stop trying
  }
}

// User hooks
export function useLeaderboard() {
  return useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
    select: (data) => data.map((item, index) => ({
      id: item.userId,
      fullName: item.fullName,
      points: item.totalPoints,
      rank: item.currentRank || index + 1,
      avatarUrl: item.avatarUrl,
      gamesPlayed: item.gamesPlayed,
      studySessions: item.studySessions,
    })),
  });
}

export function useUser(userId: string | null | undefined) {
  return useQuery<User>({
    queryKey: ["/api/user", userId],
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ userId, fullName, avatarUrl }: { userId: string; fullName?: string; avatarUrl?: string }) => {
      return apiRequest("PATCH", `/api/user/${userId}/profile`, { fullName, avatarUrl });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
        window.dispatchEvent(new Event("user-updated"));
      }
    },
  });
}

// Friend system hooks
export function useFriends(userId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/friends", userId],
    enabled: !!userId,
  });
}

export function useFriendRequests(userId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/friends", userId, "requests"],
    enabled: !!userId,
  });
}

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: async ({ userId, friendId }: { userId: string; friendId: string }) => {
      return apiRequest("POST", "/api/friends/request", { userId, friendId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });
}

export function useAcceptFriendRequest() {
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      return apiRequest("PATCH", `/api/friends/${friendshipId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });
}

export function useRejectFriendRequest() {
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      return apiRequest("PATCH", `/api/friends/${friendshipId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });
}

export function useRemoveFriend() {
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      return apiRequest("DELETE", `/api/friends/${friendshipId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });
}

export function useSearchUsers(query: string, userId?: string) {
  return useQuery<any[]>({
    queryKey: ["/api/users/search", { query, userId }],
    queryFn: async () => {
      const params = new URLSearchParams({ query });
      if (userId) params.append("userId", userId);
      const response = await fetch(`/api/users/search?${params}`);
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
    enabled: query.length >= 2,
  });
}

// Streak hooks
export function useStreak(userId: string | null | undefined) {
  return useQuery<any>({
    queryKey: ["/api/streaks", userId],
    enabled: !!userId,
  });
}

// Game hooks
export function useGames() {
  return useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
}

export function useGame(gameId: string | undefined) {
  return useQuery<Game>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });
}

export function useCompleteGame() {
  return useMutation({
    mutationFn: async ({ gameId, userId, score }: { gameId: string; userId: string; score: number }) => {
      return apiRequest("POST", `/api/games/${gameId}/complete`, { userId, score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });
}

// Study material hooks
export function useStudyMaterials() {
  return useQuery<StudyMaterial[]>({
    queryKey: ["/api/study"],
  });
}

export function useStudyMaterial(materialId: string | undefined) {
  return useQuery<StudyMaterial>({
    queryKey: ["/api/study", materialId],
    enabled: !!materialId,
  });
}

export function useCompleteStudyMaterial() {
  return useMutation({
    mutationFn: async ({ materialId, userId }: { materialId: string; userId: string }) => {
      return apiRequest("POST", `/api/study/${materialId}/complete`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });
}

// Achievement hooks
export function useAchievements(userId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/achievements", userId],
    enabled: !!userId,
  });
}

// Activity hooks
export function useActivities(userId: string | null | undefined) {
  return useQuery<UserActivity[]>({
    queryKey: ["/api/activities", userId],
    enabled: !!userId,
  });
}

// Get all activities for leaderboard time filtering
export function useAllActivities() {
  return useQuery<UserActivity[]>({
    queryKey: ["/api/activities/all"],
  });
}

// Bookmark hooks
export function useBookmarks(userId: string | null | undefined) {
  return useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", userId],
    enabled: !!userId,
  });
}

export function useCreateBookmark() {
  return useMutation({
    mutationFn: async ({ userId, studyMaterialId }: { userId: string; studyMaterialId: string }) => {
      return apiRequest("POST", "/api/bookmarks", { userId, studyMaterialId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", variables.userId] });
    },
  });
}

export function useDeleteBookmark() {
  return useMutation({
    mutationFn: async ({ userId, studyMaterialId }: { userId: string; studyMaterialId: string }) => {
      return apiRequest("DELETE", `/api/bookmarks/${userId}/${studyMaterialId}`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", variables.userId] });
    },
  });
}

// Group hooks
export function useGroups() {
  return useQuery<any[]>({
    queryKey: ["/api/groups"],
  });
}

export function useUserGroups(userId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups/user", userId],
    enabled: !!userId,
  });
}

export function useGroup(groupId: string | null | undefined) {
  return useQuery<any>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups", groupId, "members"],
    enabled: !!groupId,
  });
}

export function useGroupLeaderboard(groupId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups", groupId, "leaderboard"],
    enabled: !!groupId,
  });
}

export function useGroupActivities(groupId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups", groupId, "activities"],
    enabled: !!groupId,
  });
}

export function useGroupChallenges(groupId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups", groupId, "challenges"],
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; ownerId: string; isPublic: boolean }) => {
      return apiRequest("POST", "/api/groups", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.ownerId] });
    },
  });
}

export function useJoinGroup() {
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      return apiRequest("POST", `/api/groups/${groupId}/join`, { userId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useLeaveGroup() {
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      return apiRequest("POST", `/api/groups/${groupId}/leave`, { userId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useCreateGroupChallenge() {
  return useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/groups/${data.groupId}/challenges`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", variables.groupId, "challenges"] });
    },
  });
}

export function useGroupMessages(groupId: string | null | undefined) {
  return useQuery<any[]>({
    queryKey: ["/api/groups", groupId, "messages"],
    enabled: !!groupId,
  });
}

export function useSendGroupMessage() {
  return useMutation({
    mutationFn: async ({ groupId, userId, message }: { groupId: string; userId: string; message: string }) => {
      return apiRequest("POST", `/api/groups/${groupId}/messages`, { userId, message });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", variables.groupId, "messages"] });
    },
  });
}

// Seed data mutation
export function useSeedDatabase() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/seed", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study"] });
    },
  });
}
