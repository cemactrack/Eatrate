import React, { useEffect, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { Achievement, Badge, UserLevel, Challenge, GamificationStats } from '@/types/gamification';
import { useAuth } from './AuthProvider';

interface GamificationContextType {
  stats: GamificationStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  checkAchievements: () => Promise<void>;
  claimReward: (achievementId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  updateProgress: (action: string, value?: number) => Promise<void>;
  
  // Helpers
  getNextLevelProgress: () => number;
  getUnlockedAchievements: () => Achievement[];
  getActiveChallenges: () => Challenge[];
  canLevelUp: () => boolean;
}

export const [GamificationProvider, useGamification] = createContextHook<GamificationContextType>(() => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user gamification stats
  const statsQuery = trpc.gamification.getStats.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mutations
  const checkAchievementsMutation = trpc.gamification.checkAchievements.useMutation();
  const claimRewardMutation = trpc.gamification.claimReward.useMutation();
  const joinChallengeMutation = trpc.gamification.joinChallenge.useMutation();
  const updateProgressMutation = trpc.gamification.updateProgress.useMutation();

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
      setIsLoading(false);
      setError(null);
    } else if (statsQuery.error) {
      setError(statsQuery.error.message);
      setIsLoading(false);
    } else if (statsQuery.isLoading) {
      setIsLoading(true);
    }
  }, [statsQuery.data, statsQuery.error, statsQuery.isLoading]);

  const checkAchievements = async () => {
    try {
      const result = await checkAchievementsMutation.mutateAsync();
      if (result.newAchievements.length > 0) {
        // Show achievement notifications
        console.log('New achievements unlocked:', result.newAchievements);
      }
      await statsQuery.refetch();
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  const claimReward = async (achievementId: string) => {
    try {
      await claimRewardMutation.mutateAsync({ achievementId });
      await statsQuery.refetch();
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      await joinChallengeMutation.mutateAsync({ challengeId });
      await statsQuery.refetch();
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const updateProgress = async (action: string, value: number = 1) => {
    try {
      await updateProgressMutation.mutateAsync({ action, value });
      // Automatically check for new achievements
      await checkAchievements();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getNextLevelProgress = (): number => {
    if (!stats?.level) return 0;
    const { pointsToNext, pointsForCurrent } = stats.level;
    if (pointsToNext === 0) return 100;
    return ((pointsForCurrent - pointsToNext) / pointsForCurrent) * 100;
  };

  const getUnlockedAchievements = (): Achievement[] => {
    return stats?.achievements.filter(a => a.isUnlocked) || [];
  };

  const getActiveChallenges = (): Challenge[] => {
    return stats?.activeChallenges.filter(c => c.isActive && !c.isCompleted) || [];
  };

  const canLevelUp = (): boolean => {
    return stats?.level?.pointsToNext === 0 || false;
  };

  return {
    stats,
    isLoading,
    error,
    checkAchievements,
    claimReward,
    joinChallenge,
    updateProgress,
    getNextLevelProgress,
    getUnlockedAchievements,
    getActiveChallenges,
    canLevelUp,
  };
});

// Hook to track user actions and update gamification progress
export function useGamificationTracker() {
  const { updateProgress } = useGamification();

  const trackAction = async (action: string, value?: number) => {
    try {
      await updateProgress(action, value);
    } catch (error) {
      console.error('Failed to track gamification action:', error);
    }
  };

  return {
    trackReview: () => trackAction('review_posted'),
    trackPhoto: () => trackAction('photo_uploaded'),
    trackFollow: () => trackAction('user_followed'),
    trackRestaurantVisit: () => trackAction('restaurant_visited'),
    trackLike: () => trackAction('post_liked'),
    trackComment: () => trackAction('comment_posted'),
    trackShare: () => trackAction('post_shared'),
    trackLogin: () => trackAction('daily_login'),
    trackCustom: trackAction,
  };
}