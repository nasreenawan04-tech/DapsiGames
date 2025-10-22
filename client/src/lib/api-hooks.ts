import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import type { User, Game, StudyMaterial, Achievement, UserActivity, Bookmark } from "@shared/schema";

// Real-time websocket connection for leaderboard updates
let ws: WebSocket | null = null;

export function connectWebSocket() {
  if (typeof window === "undefined") return;
  if (ws?.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  try {
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "leaderboard_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/users/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };
  } catch (error) {
    console.error("Failed to connect WebSocket:", error);
  }
}

// User hooks
export function useLeaderboard() {
  return useQuery<User[]>({
    queryKey: ["/api/users/leaderboard"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/users/leaderboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/users/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });
}

// Achievement hooks
export function useAchievements(userId: string | null | undefined) {
  return useQuery<Achievement[]>({
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
