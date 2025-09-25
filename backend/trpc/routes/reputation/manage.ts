import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { UserReputation, ReputationBadge } from '@/types/restaurant';

// Mock data for user reputation
const mockUserReputations: UserReputation[] = [
  {
    userId: 'user1',
    level: 15,
    points: 2850,
    trustScore: 92,
    badges: [
      {
        id: '1',
        name: 'Trusted Reviewer',
        description: 'Consistently provides helpful and accurate reviews',
        icon: '⭐',
        rarity: 'rare',
        earnedAt: '2024-02-15T10:00:00Z',
        category: 'reviewer'
      },
      {
        id: '2',
        name: 'Photo Master',
        description: 'Uploaded 100+ high-quality food photos',
        icon: '📸',
        rarity: 'epic',
        earnedAt: '2024-03-01T14:30:00Z',
        category: 'photographer'
      },
      {
        id: '3',
        name: 'Local Explorer',
        description: 'Discovered 50+ restaurants in your city',
        icon: '🗺️',
        rarity: 'rare',
        earnedAt: '2024-01-20T09:15:00Z',
        category: 'explorer'
      }
    ],
    stats: {
      totalReviews: 127,
      helpfulVotes: 89,
      photosUploaded: 156,
      placesDiscovered: 73,
      followersCount: 245
    }
  }
];

const availableBadges: ReputationBadge[] = [
  // Reviewer Badges
  {
    id: 'reviewer_newbie',
    name: 'First Review',
    description: 'Write your first restaurant review',
    icon: '✍️',
    rarity: 'common',
    earnedAt: '',
    category: 'reviewer'
  },
  {
    id: 'reviewer_active',
    name: 'Active Reviewer',
    description: 'Write 10 restaurant reviews',
    icon: '📝',
    rarity: 'common',
    earnedAt: '',
    category: 'reviewer'
  },
  {
    id: 'reviewer_dedicated',
    name: 'Dedicated Reviewer',
    description: 'Write 50 restaurant reviews',
    icon: '📋',
    rarity: 'rare',
    earnedAt: '',
    category: 'reviewer'
  },
  {
    id: 'reviewer_expert',
    name: 'Review Expert',
    description: 'Write 100 restaurant reviews',
    icon: '🏆',
    rarity: 'epic',
    earnedAt: '',
    category: 'reviewer'
  },
  {
    id: 'reviewer_master',
    name: 'Review Master',
    description: 'Write 250 restaurant reviews',
    icon: '👑',
    rarity: 'legendary',
    earnedAt: '',
    category: 'reviewer'
  },
  
  // Explorer Badges
  {
    id: 'explorer_curious',
    name: 'Curious Explorer',
    description: 'Visit 5 different restaurants',
    icon: '🧭',
    rarity: 'common',
    earnedAt: '',
    category: 'explorer'
  },
  {
    id: 'explorer_adventurous',
    name: 'Adventurous Foodie',
    description: 'Visit 25 different restaurants',
    icon: '🗺️',
    rarity: 'rare',
    earnedAt: '',
    category: 'explorer'
  },
  {
    id: 'explorer_master',
    name: 'Master Explorer',
    description: 'Visit 100 different restaurants',
    icon: '🌟',
    rarity: 'epic',
    earnedAt: '',
    category: 'explorer'
  },
  
  // Photographer Badges
  {
    id: 'photo_first',
    name: 'First Photo',
    description: 'Upload your first food photo',
    icon: '📷',
    rarity: 'common',
    earnedAt: '',
    category: 'photographer'
  },
  {
    id: 'photo_enthusiast',
    name: 'Photo Enthusiast',
    description: 'Upload 25 food photos',
    icon: '📸',
    rarity: 'rare',
    earnedAt: '',
    category: 'photographer'
  },
  {
    id: 'photo_master',
    name: 'Photo Master',
    description: 'Upload 100 food photos',
    icon: '🎨',
    rarity: 'epic',
    earnedAt: '',
    category: 'photographer'
  },
  
  // Social Badges
  {
    id: 'social_friendly',
    name: 'Friendly Foodie',
    description: 'Get 10 followers',
    icon: '👥',
    rarity: 'common',
    earnedAt: '',
    category: 'social'
  },
  {
    id: 'social_popular',
    name: 'Popular Foodie',
    description: 'Get 100 followers',
    icon: '🌟',
    rarity: 'rare',
    earnedAt: '',
    category: 'social'
  },
  {
    id: 'social_influencer',
    name: 'Food Influencer',
    description: 'Get 500 followers',
    icon: '💫',
    rarity: 'epic',
    earnedAt: '',
    category: 'social'
  },
  
  // Special Badges
  {
    id: 'special_early_adopter',
    name: 'Early Adopter',
    description: 'One of the first 1000 users',
    icon: '🚀',
    rarity: 'legendary',
    earnedAt: '',
    category: 'special'
  },
  {
    id: 'special_beta_tester',
    name: 'Beta Tester',
    description: 'Participated in beta testing',
    icon: '🧪',
    rarity: 'epic',
    earnedAt: '',
    category: 'special'
  },
  {
    id: 'special_community_hero',
    name: 'Community Hero',
    description: 'Made significant contributions to the community',
    icon: '🦸',
    rarity: 'legendary',
    earnedAt: '',
    category: 'special'
  }
];

// Get user reputation
export const getUserReputationProcedure = publicProcedure
  .input(z.object({
    userId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('[getUserReputation] Fetching reputation for user:', input.userId);
    
    const reputation = mockUserReputations.find(rep => rep.userId === input.userId);
    
    if (!reputation) {
      // Return default reputation for new users
      return {
        userId: input.userId,
        level: 1,
        points: 0,
        trustScore: 50,
        badges: [],
        stats: {
          totalReviews: 0,
          helpfulVotes: 0,
          photosUploaded: 0,
          placesDiscovered: 0,
          followersCount: 0
        }
      };
    }
    
    return reputation;
  });

// Get reputation leaderboard
export const getReputationLeaderboardProcedure = publicProcedure
  .input(z.object({
    type: z.enum(['points', 'level', 'trustScore', 'reviews']).default('points'),
    city: z.string().optional(),
    limit: z.number().default(50)
  }))
  .query(async ({ input }) => {
    console.log('[getReputationLeaderboard] Fetching leaderboard:', input.type);
    
    // Mock implementation - in real app, query database with proper sorting
    let sorted = [...mockUserReputations];
    
    switch (input.type) {
      case 'points':
        sorted.sort((a, b) => b.points - a.points);
        break;
      case 'level':
        sorted.sort((a, b) => b.level - a.level);
        break;
      case 'trustScore':
        sorted.sort((a, b) => b.trustScore - a.trustScore);
        break;
      case 'reviews':
        sorted.sort((a, b) => b.stats.totalReviews - a.stats.totalReviews);
        break;
    }
    
    return {
      leaderboard: sorted.slice(0, input.limit).map((rep, index) => ({
        rank: index + 1,
        userId: rep.userId,
        level: rep.level,
        points: rep.points,
        trustScore: rep.trustScore,
        totalReviews: rep.stats.totalReviews,
        badges: rep.badges.filter(badge => badge.rarity === 'legendary' || badge.rarity === 'epic').slice(0, 3)
      })),
      type: input.type,
      lastUpdated: new Date().toISOString()
    };
  });

// Award points to user
export const awardPointsProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    points: z.number(),
    reason: z.string(),
    category: z.enum(['review', 'photo', 'discovery', 'social', 'special'])
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[awardPoints] Awarding points to user:', input.userId, input.points);
    
    let userReputation = mockUserReputations.find(rep => rep.userId === input.userId);
    
    if (!userReputation) {
      // Create new reputation record
      userReputation = {
        userId: input.userId,
        level: 1,
        points: 0,
        trustScore: 50,
        badges: [],
        stats: {
          totalReviews: 0,
          helpfulVotes: 0,
          photosUploaded: 0,
          placesDiscovered: 0,
          followersCount: 0
        }
      };
      mockUserReputations.push(userReputation);
    }
    
    // Award points
    const oldPoints = userReputation.points;
    userReputation.points += input.points;
    
    // Calculate new level (every 200 points = 1 level)
    const newLevel = Math.floor(userReputation.points / 200) + 1;
    const leveledUp = newLevel > userReputation.level;
    userReputation.level = newLevel;
    
    // Update stats based on category
    switch (input.category) {
      case 'review':
        userReputation.stats.totalReviews += 1;
        break;
      case 'photo':
        userReputation.stats.photosUploaded += 1;
        break;
      case 'discovery':
        userReputation.stats.placesDiscovered += 1;
        break;
      case 'social':
        userReputation.stats.followersCount += 1;
        break;
    }
    
    // Check for new badges
    const newBadges = await checkForNewBadges(userReputation);
    
    return {
      success: true,
      pointsAwarded: input.points,
      totalPoints: userReputation.points,
      level: userReputation.level,
      leveledUp,
      newBadges,
      reason: input.reason
    };
  });

// Check for new badges
async function checkForNewBadges(reputation: UserReputation): Promise<ReputationBadge[]> {
  const newBadges: ReputationBadge[] = [];
  const earnedBadgeIds = reputation.badges.map(b => b.id);
  
  // Check reviewer badges
  if (reputation.stats.totalReviews >= 1 && !earnedBadgeIds.includes('reviewer_newbie')) {
    const badge = availableBadges.find(b => b.id === 'reviewer_newbie');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  if (reputation.stats.totalReviews >= 10 && !earnedBadgeIds.includes('reviewer_active')) {
    const badge = availableBadges.find(b => b.id === 'reviewer_active');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  if (reputation.stats.totalReviews >= 50 && !earnedBadgeIds.includes('reviewer_dedicated')) {
    const badge = availableBadges.find(b => b.id === 'reviewer_dedicated');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  // Check explorer badges
  if (reputation.stats.placesDiscovered >= 5 && !earnedBadgeIds.includes('explorer_curious')) {
    const badge = availableBadges.find(b => b.id === 'explorer_curious');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  // Check photographer badges
  if (reputation.stats.photosUploaded >= 1 && !earnedBadgeIds.includes('photo_first')) {
    const badge = availableBadges.find(b => b.id === 'photo_first');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  // Check social badges
  if (reputation.stats.followersCount >= 10 && !earnedBadgeIds.includes('social_friendly')) {
    const badge = availableBadges.find(b => b.id === 'social_friendly');
    if (badge) {
      const earnedBadge = { ...badge, earnedAt: new Date().toISOString() };
      reputation.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  }
  
  return newBadges;
}

// Get available badges
export const getAvailableBadgesProcedure = publicProcedure
  .input(z.object({
    category: z.enum(['reviewer', 'explorer', 'photographer', 'social', 'special']).optional()
  }))
  .query(async ({ input }) => {
    console.log('[getAvailableBadges] Fetching available badges');
    
    let badges = availableBadges;
    
    if (input.category) {
      badges = badges.filter(badge => badge.category === input.category);
    }
    
    // Group by category
    const grouped = badges.reduce((acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    }, {} as Record<string, ReputationBadge[]>);
    
    return {
      badges: grouped,
      total: badges.length
    };
  });

// Update trust score
export const updateTrustScoreProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    action: z.enum(['helpful_review', 'unhelpful_review', 'verified_visit', 'fake_review']),
    impact: z.number().min(-10).max(10)
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[updateTrustScore] Updating trust score for user:', input.userId);
    
    let userReputation = mockUserReputations.find(rep => rep.userId === input.userId);
    
    if (!userReputation) {
      throw new Error('User reputation not found');
    }
    
    // Update trust score
    const oldScore = userReputation.trustScore;
    userReputation.trustScore = Math.max(0, Math.min(100, userReputation.trustScore + input.impact));
    
    // Update helpful votes if applicable
    if (input.action === 'helpful_review') {
      userReputation.stats.helpfulVotes += 1;
    }
    
    return {
      success: true,
      oldScore,
      newScore: userReputation.trustScore,
      change: userReputation.trustScore - oldScore,
      action: input.action
    };
  });

// Get user achievements summary
export const getUserAchievementsSummaryProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[getUserAchievementsSummary] Fetching achievements for user:', ctx.user?.id);
    
    const reputation = mockUserReputations.find(rep => rep.userId === ctx.user?.id);
    
    if (!reputation) {
      return {
        totalBadges: 0,
        badgesByRarity: {
          common: 0,
          rare: 0,
          epic: 0,
          legendary: 0
        },
        recentBadges: [],
        nextBadges: [],
        progress: {
          currentLevel: 1,
          pointsToNextLevel: 200,
          progressPercentage: 0
        }
      };
    }
    
    const badgesByRarity = reputation.badges.reduce((acc, badge) => {
      acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentBadges = reputation.badges
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 5);
    
    // Calculate next level progress
    const pointsInCurrentLevel = reputation.points % 200;
    const progressPercentage = (pointsInCurrentLevel / 200) * 100;
    
    return {
      totalBadges: reputation.badges.length,
      badgesByRarity: {
        common: badgesByRarity.common || 0,
        rare: badgesByRarity.rare || 0,
        epic: badgesByRarity.epic || 0,
        legendary: badgesByRarity.legendary || 0
      },
      recentBadges,
      nextBadges: [], // TODO: Calculate next achievable badges
      progress: {
        currentLevel: reputation.level,
        pointsToNextLevel: 200 - pointsInCurrentLevel,
        progressPercentage
      }
    };
  });