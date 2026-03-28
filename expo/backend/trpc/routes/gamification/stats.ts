import { z } from 'zod';
import { protectedProcedure } from '../../create-context';

// Mock data for gamification
const mockAchievements = [
  {
    id: '1',
    title: 'First Review',
    description: 'Write your first restaurant review',
    icon: '✍️',
    category: 'reviews' as const,
    requirement: 1,
    currentProgress: 1,
    isUnlocked: true,
    unlockedAt: new Date(),
    points: 10,
    rarity: 'common' as const,
  },
  {
    id: '2',
    title: 'Photo Enthusiast',
    description: 'Upload 10 food photos',
    icon: '📸',
    category: 'photos' as const,
    requirement: 10,
    currentProgress: 3,
    isUnlocked: false,
    points: 25,
    rarity: 'rare' as const,
  },
  {
    id: '3',
    title: 'Social Butterfly',
    description: 'Follow 20 other foodies',
    icon: '🦋',
    category: 'social' as const,
    requirement: 20,
    currentProgress: 8,
    isUnlocked: false,
    points: 15,
    rarity: 'common' as const,
  },
];

const mockChallenges = [
  {
    id: '1',
    title: 'Weekend Food Explorer',
    description: 'Visit 3 new restaurants this weekend',
    type: 'weekly' as const,
    category: 'exploration' as const,
    requirement: 3,
    currentProgress: 1,
    reward: {
      points: 50,
      badge: 'Explorer Badge',
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    isCompleted: false,
  },
];

const mockUserLevel = {
  level: 3,
  title: 'Food Enthusiast',
  totalPoints: 150,
  pointsToNext: 50,
  pointsForCurrent: 100,
  benefits: ['Early access to events', 'Exclusive badges', 'Priority support'],
};

export const getStatsProcedure = protectedProcedure.query(async ({ ctx }) => {
  // In a real app, fetch from database
  return {
    totalPoints: 150,
    level: mockUserLevel,
    achievements: mockAchievements,
    badges: [],
    activeChallenges: mockChallenges,
    completedChallenges: [],
    leaderboardRank: {
      daily: 15,
      weekly: 8,
      monthly: 12,
      allTime: 25,
    },
  };
});

export const checkAchievementsProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  // In a real app, check user progress and unlock achievements
  return {
    newAchievements: [],
    updatedProgress: [],
  };
});

export const claimRewardProcedure = protectedProcedure
  .input(z.object({ achievementId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, mark achievement as claimed and give rewards
    return { success: true };
  });

export const joinChallengeProcedure = protectedProcedure
  .input(z.object({ challengeId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, add user to challenge
    return { success: true };
  });

export const updateProgressProcedure = protectedProcedure
  .input(z.object({ 
    action: z.string(),
    value: z.number().optional().default(1)
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, update user progress for various actions
    console.log(`User ${ctx.user.id} performed action: ${input.action} with value: ${input.value}`);
    return { success: true };
  });