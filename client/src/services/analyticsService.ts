import { supabase } from "@/lib/supabase";

export interface UserEngagementMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalTimeSpent: number;
  lastActivityDate: string | null;
  activeDays: number;
}

export interface LearningProgressMetrics {
  studyMaterialsCompleted: number;
  gamesCompleted: number;
  totalPointsEarned: number;
  averageQuizScore: number;
  streak: number;
}

export interface ConversionMetrics {
  guestVisits: number;
  signupRate: number;
  timeToConversion: number;
}

export const analyticsService = {
  async trackEvent(userId: string | null, eventType: string, eventData?: any) {
    try {
      const { error } = await supabase.from("user_activities").insert({
        user_id: userId || "guest",
        activity_type: eventType,
        activity_title: eventData?.title || eventType,
        points_earned: eventData?.points || 0,
      });

      if (error && error.code !== "23503") {
        console.error("Error tracking event:", error);
      }
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  },

  async getUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics> {
    const { data: activities, error } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    const totalSessions = activities?.length || 0;
    const lastActivityDate = activities?.[0]?.timestamp || null;

    const uniqueDays = new Set(
      activities?.map(a => new Date(a.timestamp).toDateString()) || []
    );

    return {
      totalSessions,
      averageSessionDuration: 0,
      totalTimeSpent: 0,
      lastActivityDate,
      activeDays: uniqueDays.size,
    };
  },

  async getLearningProgressMetrics(userId: string): Promise<LearningProgressMetrics> {
    const [studyProgress, gameProgress, userStats, gameScores] = await Promise.all([
      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("item_type", "study_material")
        .eq("completed", true),
      supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("item_type", "game")
        .eq("completed", true),
      supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("game_scores")
        .select("score")
        .eq("user_id", userId),
    ]);

    const studyMaterialsCompleted = studyProgress.data?.length || 0;
    const gamesCompleted = gameProgress.data?.length || 0;
    const totalPointsEarned = userStats.data?.total_points || 0;

    const averageQuizScore = gameScores.data?.length
      ? gameScores.data.reduce((sum, s) => sum + s.score, 0) / gameScores.data.length
      : 0;

    const streak = await this.calculateStreak(userId);

    return {
      studyMaterialsCompleted,
      gamesCompleted,
      totalPointsEarned,
      averageQuizScore: Math.round(averageQuizScore),
      streak,
    };
  },

  async calculateStreak(userId: string): Promise<number> {
    const { data: activities } = await supabase
      .from("user_activities")
      .select("timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(30);

    if (!activities || activities.length === 0) return 0;

    let streak = 1;
    const today = new Date().toDateString();
    let currentDate = new Date(activities[0].timestamp).toDateString();

    if (currentDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (currentDate !== yesterday.toDateString()) {
        return 0;
      }
    }

    for (let i = 1; i < activities.length; i++) {
      const activityDate = new Date(activities[i].timestamp);
      const prevDate = new Date(activities[i - 1].timestamp);

      const dayDiff = Math.floor(
        (prevDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return streak;
  },

  async getRetentionRate(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: totalUsers, error: totalError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .gte("created_at", cutoffDate.toISOString());

    const { data: activeUsers, error: activeError } = await supabase
      .from("user_activities")
      .select("user_id")
      .gte("timestamp", cutoffDate.toISOString());

    if (totalError || activeError) {
      console.error("Error calculating retention:", totalError || activeError);
      return 0;
    }

    const totalCount = totalUsers?.length || 0;
    const uniqueActiveUsers = new Set(activeUsers?.map(a => a.user_id) || []).size;

    return totalCount > 0 ? (uniqueActiveUsers / totalCount) * 100 : 0;
  },

  async getPopularContent(type: "study_material" | "game", limit: number = 10) {
    const table = type === "study_material" ? "study_materials" : "games";
    const progressType = type;

    const { data, error } = await supabase.rpc("get_popular_content", {
      content_type: progressType,
      result_limit: limit,
    });

    if (error) {
      console.log("RPC not available, using fallback");

      const { data: allContent, error: contentError } = await supabase
        .from(table)
        .select("*")
        .limit(limit);

      if (contentError) throw contentError;
      return allContent;
    }

    return data;
  },

  async getLeaderboardInsights() {
    const { data, error } = await supabase
      .from("users")
      .select("points, rank")
      .not("rank", "is", null)
      .order("rank", { ascending: true })
      .limit(100);

    if (error) throw error;

    const totalUsers = data.length;
    const averagePoints = totalUsers > 0
      ? data.reduce((sum, user) => sum + user.points, 0) / totalUsers
      : 0;

    return {
      totalUsers,
      averagePoints: Math.round(averagePoints),
      topUserPoints: data[0]?.points || 0,
    };
  },
};
