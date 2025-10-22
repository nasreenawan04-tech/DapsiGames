import { useAuth } from "@/lib/auth";

export function useGuestRestrictions() {
  const { user } = useAuth();

  const isGuest = !user;

  const canAccessFeature = (feature: string): boolean => {
    if (!isGuest) return true;

    const guestAllowedFeatures = [
      "home",
      "leaderboard_view",
      "study_preview",
      "games_preview",
    ];

    return guestAllowedFeatures.includes(feature);
  };

  const getFeaturLimit = (feature: string): number => {
    if (!isGuest) return Infinity;

    const limits: Record<string, number> = {
      study_materials: 3,
      games: 2,
      daily_activities: 5,
    };

    return limits[feature] || 0;
  };

  const shouldShowUpgradePrompt = (feature: string): boolean => {
    return isGuest && !canAccessFeature(feature);
  };

  return {
    isGuest,
    canAccessFeature,
    getFeaturLimit,
    shouldShowUpgradePrompt,
  };
}
