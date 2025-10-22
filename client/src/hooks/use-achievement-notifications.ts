import { useEffect } from "react";
import { achievementService } from "@/services/achievementService";
import { useToast } from "@/hooks/use-toast";
import type { AchievementDefinition } from "@shared/schema";
import { Trophy } from "lucide-react";

export function useAchievementNotifications(userId: string | null) {
  const { toast } = useToast();

  const checkAchievements = async () => {
    if (!userId) return;

    try {
      const newlyUnlocked = await achievementService.checkAndUnlockAchievements(userId);

      for (const achievement of newlyUnlocked) {
        showAchievementToast(achievement);
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  const showAchievementToast = (achievement: AchievementDefinition) => {
    toast({
      title: "Achievement Unlocked!",
      description: `${achievement.name} - ${achievement.description}`,
      duration: 5000,
    });
  };

  return {
    checkAchievements,
    showAchievementToast,
  };
}
