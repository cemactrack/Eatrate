export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'social' | 'reviews' | 'photos' | 'exploration' | 'special';
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  category: string;
}

export interface UserLevel {
  level: number;
  title: string;
  totalPoints: number;
  pointsToNext: number;
  pointsForCurrent: number;
  benefits: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: 'reviews' | 'photos' | 'social' | 'exploration';
  requirement: number;
  currentProgress: number;
  reward: {
    points: number;
    badge?: string;
    achievement?: string;
  };
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCompleted: boolean;
}

export interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  category: 'points' | 'reviews' | 'photos' | 'followers';
  users: LeaderboardUser[];
}

export interface LeaderboardUser {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  change: number; // +/- from previous period
}

export interface GamificationStats {
  totalPoints: number;
  level: UserLevel;
  achievements: Achievement[];
  badges: Badge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  leaderboardRank: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
}