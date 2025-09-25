import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import type { LoyaltyPoints, Reward } from '@/types/advanced-features';

const mockUserPoints: Record<string, LoyaltyPoints[]> = {};
const mockRewards: Reward[] = [
  {
    id: 'reward_1',
    title: '10% Off Next Meal',
    description: 'Get 10% discount on your next order at any participating restaurant',
    pointsCost: 500,
    type: 'discount',
    value: 10,
    isActive: true,
  },
  {
    id: 'reward_2',
    title: 'Free Appetizer',
    description: 'Complimentary appetizer at Mama Njoku Kitchen',
    pointsCost: 750,
    type: 'free_meal',
    value: 2500,
    restaurantId: '1',
    isActive: true,
  },
  {
    id: 'reward_3',
    title: 'Jumia Food Voucher',
    description: '5000 CFA voucher for Jumia Food delivery',
    pointsCost: 1200,
    type: 'partner_reward',
    value: 5000,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'reward_4',
    title: 'Free Main Course',
    description: 'Free main course at Traditional Taste (up to 8000 CFA)',
    pointsCost: 2000,
    type: 'free_meal',
    value: 8000,
    restaurantId: '3',
    isActive: true,
  },
];

export const getUserPointsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[Loyalty] Getting points for user:', ctx.user.id);

    const userPointsHistory = mockUserPoints[ctx.user.id] || [
      {
        id: 'points_1',
        userId: ctx.user.id,
        points: 50,
        source: 'review',
        description: 'Reviewed Mama Njoku Kitchen',
        restaurantId: '1',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'points_2',
        userId: ctx.user.id,
        points: 25,
        source: 'post',
        description: 'Posted food photo',
        createdAt: new Date(Date.now() - 172800000),
      },
      {
        id: 'points_3',
        userId: ctx.user.id,
        points: 100,
        source: 'dining',
        description: 'Dined at Suya Palace',
        restaurantId: '2',
        createdAt: new Date(Date.now() - 259200000),
      },
      {
        id: 'points_4',
        userId: ctx.user.id,
        points: 200,
        source: 'referral',
        description: 'Referred a friend',
        createdAt: new Date(Date.now() - 345600000),
      },
    ];

    mockUserPoints[ctx.user.id] = userPointsHistory;

    const totalPoints = userPointsHistory.reduce((sum, p) => sum + p.points, 0);
    const thisMonthPoints = userPointsHistory
      .filter(p => p.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, p) => sum + p.points, 0);

    return {
      totalPoints,
      thisMonthPoints,
      history: userPointsHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      level: calculateUserLevel(totalPoints),
      nextLevelPoints: getNextLevelPoints(totalPoints),
      achievements: getUserAchievements(userPointsHistory),
    };
  });

export const awardPointsProcedure = protectedProcedure
  .input(z.object({
    points: z.number().min(1).max(1000),
    source: z.enum(['review', 'post', 'dining', 'referral', 'bonus']),
    description: z.string(),
    restaurantId: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Loyalty] Awarding points to user:', ctx.user.id);

    const newPoints: LoyaltyPoints = {
      id: `points_${Date.now()}`,
      userId: ctx.user.id,
      points: input.points,
      source: input.source,
      description: input.description,
      restaurantId: input.restaurantId,
      createdAt: new Date(),
    };

    if (!mockUserPoints[ctx.user.id]) {
      mockUserPoints[ctx.user.id] = [];
    }
    mockUserPoints[ctx.user.id].push(newPoints);

    const totalPoints = mockUserPoints[ctx.user.id].reduce((sum, p) => sum + p.points, 0);

    return {
      success: true,
      pointsAwarded: input.points,
      totalPoints,
      newLevel: calculateUserLevel(totalPoints),
      leveledUp: calculateUserLevel(totalPoints) > calculateUserLevel(totalPoints - input.points),
    };
  });

export const getAvailableRewardsProcedure = protectedProcedure
  .input(z.object({
    category: z.enum(['discount', 'free_meal', 'partner_reward']).optional(),
    restaurantId: z.string().optional(),
  }))
  .query(async ({ input, ctx }) => {
    console.log('[Loyalty] Getting rewards for user:', ctx.user.id);

    const userPoints = mockUserPoints[ctx.user.id]?.reduce((sum, p) => sum + p.points, 0) || 0;
    
    let filteredRewards = mockRewards.filter(r => r.isActive);
    
    if (input.category) {
      filteredRewards = filteredRewards.filter(r => r.type === input.category);
    }
    
    if (input.restaurantId) {
      filteredRewards = filteredRewards.filter(r => r.restaurantId === input.restaurantId);
    }

    return {
      rewards: filteredRewards.map(reward => ({
        ...reward,
        canAfford: userPoints >= reward.pointsCost,
        daysUntilExpiry: reward.expiresAt 
          ? Math.ceil((reward.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : null,
      })),
      userPoints,
    };
  });

export const redeemRewardProcedure = protectedProcedure
  .input(z.object({
    rewardId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Loyalty] Redeeming reward:', input.rewardId, 'for user:', ctx.user.id);

    const reward = mockRewards.find(r => r.id === input.rewardId && r.isActive);
    if (!reward) {
      throw new Error('Reward not found or inactive');
    }

    const userPoints = mockUserPoints[ctx.user.id]?.reduce((sum, p) => sum + p.points, 0) || 0;
    if (userPoints < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    const deductionPoints: LoyaltyPoints = {
      id: `points_deduction_${Date.now()}`,
      userId: ctx.user.id,
      points: -reward.pointsCost,
      source: 'bonus',
      description: `Redeemed: ${reward.title}`,
      createdAt: new Date(),
    };

    if (!mockUserPoints[ctx.user.id]) {
      mockUserPoints[ctx.user.id] = [];
    }
    mockUserPoints[ctx.user.id].push(deductionPoints);

    const redemptionCode = `ER${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      redemptionCode,
      reward: {
        ...reward,
        redeemedAt: new Date(),
      },
      remainingPoints: userPoints - reward.pointsCost,
      instructions: getRedemptionInstructions(reward),
    };
  });

function calculateUserLevel(points: number): number {
  if (points < 100) return 1;
  if (points < 500) return 2;
  if (points < 1000) return 3;
  if (points < 2500) return 4;
  if (points < 5000) return 5;
  return 6;
}

function getNextLevelPoints(points: number): number {
  const levels = [100, 500, 1000, 2500, 5000];
  for (const levelPoints of levels) {
    if (points < levelPoints) {
      return levelPoints - points;
    }
  }
  return 0;
}

function getUserAchievements(history: LoyaltyPoints[]): string[] {
  const achievements: string[] = [];
  const totalPoints = history.reduce((sum, p) => sum + p.points, 0);
  const reviewCount = history.filter(p => p.source === 'review').length;
  const postCount = history.filter(p => p.source === 'post').length;

  if (totalPoints >= 1000) achievements.push('Point Collector');
  if (reviewCount >= 10) achievements.push('Review Master');
  if (postCount >= 20) achievements.push('Social Foodie');
  if (history.length >= 50) achievements.push('Active Member');

  return achievements;
}

function getRedemptionInstructions(reward: Reward): string {
  switch (reward.type) {
    case 'discount':
      return `Show this code at checkout: ${reward.id.toUpperCase()}. Valid for 30 days.`;
    case 'free_meal':
      return `Present this code to your server: ${reward.id.toUpperCase()}. Valid at participating locations.`;
    case 'partner_reward':
      return `Use this code in the partner app: ${reward.id.toUpperCase()}. Check terms and conditions.`;
    default:
      return 'Contact customer support for redemption instructions.';
  }
}