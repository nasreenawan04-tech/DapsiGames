import { supabase } from "@/lib/supabase";
import type { AchievementDefinition, UserAchievement } from "@shared/schema";

export interface AchievementProgress {
  achievement: AchievementDefinition;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  progressPercentage: number;
}

export const achievementService = {
  async getAllAchievements() {
    const { data, error } = await supabase
      .from("achievement_definitions")
      .select("*")
      .order("points_required", { ascending: true });

    if (error) throw error;
    return data as AchievementDefinition[];
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievement:achievement_id (*)
      `)
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const [achievements, userAchievements, userStats] = await Promise.all([
      this.getAllAchievements(),
      this.getUserAchievements(userId),
      this.getUserStats(userId),
    ]);

    const earnedIds = new Set(userAchievements?.map(ua => (ua as any).achievement.id) || []);
    
    return achievements.map(achievement => {
      const earned = earnedIds.has(achievement.id);
      const earnedAchievement = userAchievements?.find(
        ua => (ua as any).achievement.id === achievement.id
      );

      const currentPoints = userStats?.total_points || 0;
      const progress = Math.min(currentPoints, achievement.pointsRequired);
      const progressPercentage = Math.round((progress / achievement.pointsRequired) * 100);

      return {
        achievement,
        earned,
        earnedAt: earnedAchievement?.earned_at,
        progress,
        progressPercentage,
      };
    });
  },

  async checkAndUnlockAchievements(userId: string) {
    const progress = await this.getUserAchievementProgress(userId);
    const newlyUnlocked: AchievementDefinition[] = [];

    for (const item of progress) {
      if (!item.earned && item.progressPercentage >= 100) {
        try {
          const { data, error } = await supabase
            .from("user_achievements")
            .insert({
              user_id: userId,
              achievement_id: item.achievement.id,
            })
            .select()
            .single();

          if (!error) {
            newlyUnlocked.push(item.achievement);
          }
        } catch (error) {
          console.error("Error unlocking achievement:", error);
        }
      }
    }

    return newlyUnlocked;
  },

  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAchievementsByCategory(category: string) {
    const { data, error } = await supabase
      .from("achievement_definitions")
      .select("*")
      .eq("category", category)
      .order("points_required", { ascending: true });

    if (error) throw error;
    return data as AchievementDefinition[];
  },

  async getRecentAchievements(userId: string, limit: number = 5) {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievement:achievement_id (*)
      `)
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getAchievementStats(userId: string) {
    const [allAchievements, userAchievements] = await Promise.all([
      this.getAllAchievements(),
      this.getUserAchievements(userId),
    ]);

    return {
      total: allAchievements.length,
      earned: userAchievements?.length || 0,
      percentage: Math.round(((userAchievements?.length || 0) / allAchievements.length) * 100),
    };
  },
};
