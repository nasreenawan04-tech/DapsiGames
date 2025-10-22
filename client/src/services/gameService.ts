import { supabase } from "@/lib/supabase";
import type { Game, InsertGame, GameScore, UserProgress } from "@shared/schema";

export interface GameFilters {
  category?: string;
  difficulty?: string;
  searchQuery?: string;
}

export interface GameState {
  score: number;
  timeElapsed: number;
  currentQuestion?: number;
  totalQuestions?: number;
}

export const gameService = {
  async getAllGames(filters?: GameFilters) {
    let query = supabase.from("games").select("*");

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query.order("title", { ascending: true });

    if (error) throw error;
    return data as Game[];
  },

  async getGameById(id: string) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Game;
  },

  async getHighScores(gameId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from("game_scores")
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getUserHighScore(userId: string, gameId: string) {
    const { data, error } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as GameScore | null;
  },

  async saveGameScore(userId: string, gameId: string, score: number) {
    const { data, error } = await supabase
      .from("game_scores")
      .insert({
        user_id: userId,
        game_id: gameId,
        score,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GameScore;
  },

  async completeGame(userId: string, gameId: string, score: number, game: Game) {
    await this.saveGameScore(userId, gameId, score);

    const pointsEarned = this.calculatePoints(score, game.pointsReward);

    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsError) throw statsError;

    if (stats) {
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          total_points: stats.total_points + pointsEarned,
          games_played: stats.games_played + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    }

    const { error: userError } = await supabase.rpc("add_user_points", {
      user_id: userId,
      points_to_add: pointsEarned,
    });

    if (userError) throw userError;

    const { error: activityError } = await supabase
      .from("user_activities")
      .insert({
        user_id: userId,
        activity_type: "game_completed",
        activity_title: game.title,
        points_earned: pointsEarned,
      });

    if (activityError) throw activityError;

    await this.trackProgress(userId, gameId, 100);

    return pointsEarned;
  },

  async trackProgress(userId: string, gameId: string, progressPercentage: number) {
    const completed = progressPercentage >= 100;
    
    const { data: existing, error: fetchError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("item_type", "game")
      .eq("item_id", gameId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { data, error } = await supabase
        .from("user_progress")
        .update({
          progress_percentage: progressPercentage,
          completed,
          last_accessed_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : existing.completed_at,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProgress;
    } else {
      const { data, error } = await supabase
        .from("user_progress")
        .insert({
          user_id: userId,
          item_type: "game",
          item_id: gameId,
          progress_percentage: progressPercentage,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserProgress;
    }
  },

  calculatePoints(score: number, maxPoints: number): number {
    const percentage = Math.min(100, Math.max(0, score));
    return Math.round((percentage / 100) * maxPoints);
  },

  async getCategories() {
    const { data, error } = await supabase
      .from("games")
      .select("category")
      .order("category", { ascending: true });

    if (error) throw error;

    const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
    return uniqueCategories;
  },

  async getUserGameStats(userId: string) {
    const { data: scores, error: scoresError } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId);

    if (scoresError) throw scoresError;

    const totalGamesPlayed = scores?.length || 0;
    const averageScore = scores?.length
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0;

    return {
      totalGamesPlayed,
      averageScore: Math.round(averageScore),
      highestScore: scores?.length ? Math.max(...scores.map(s => s.score)) : 0,
    };
  },
};
