import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import type { User } from '@/types/restaurant';

export const getAllUsersProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    search: z.string().optional(),
    status: z.enum(['all', 'active', 'suspended', 'banned']).default('all'),
    sortBy: z.enum(['createdAt', 'lastActive', 'postsCount', 'followersCount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const users: User[] = [
      {
        id: '1',
        username: 'foodie_john',
        displayName: 'John Smith',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        bio: 'Food enthusiast and restaurant reviewer',
        followersCount: 1250,
        followingCount: 340,
        postsCount: 89,
        badges: ['verified', 'top_reviewer'],
        preferences: {
          cuisines: ['Italian', 'Japanese', 'Mexican'],
          dietaryRestrictions: ['vegetarian'],
          priceRange: ['$$', '$$$'],
        },
      },
      {
        id: '2',
        username: 'chef_maria',
        displayName: 'Maria Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
        bio: 'Professional chef sharing culinary adventures',
        followersCount: 3420,
        followingCount: 180,
        postsCount: 156,
        badges: ['verified', 'chef', 'influencer'],
        preferences: {
          cuisines: ['Spanish', 'Mediterranean', 'French'],
          dietaryRestrictions: [],
          priceRange: ['$$$', '$$$$'],
        },
      },
    ];

    return {
      users: users.slice(input.offset, input.offset + input.limit),
      total: users.length,
      hasMore: input.offset + input.limit < users.length,
    };
  });

export const getUserDetailsProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database query
    return {
      id: input.userId,
      username: 'foodie_john',
      displayName: 'John Smith',
      email: 'john@example.com',
      phone: '+1234567890',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      bio: 'Food enthusiast and restaurant reviewer',
      followersCount: 1250,
      followingCount: 340,
      postsCount: 89,
      badges: ['verified', 'top_reviewer'],
      status: 'active',
      createdAt: '2023-01-15T10:30:00Z',
      lastActiveAt: '2024-01-20T15:45:00Z',
      preferences: {
        cuisines: ['Italian', 'Japanese', 'Mexican'],
        dietaryRestrictions: ['vegetarian'],
        priceRange: ['$$', '$$$'],
      },
      stats: {
        totalLikes: 5420,
        totalComments: 890,
        avgRating: 4.2,
        topCuisines: ['Italian', 'Japanese'],
      },
    };
  });

export const updateUserStatusProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    status: z.enum(['active', 'suspended', 'banned']),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Updating user ${input.userId} status to ${input.status}`, input.reason);
    return { success: true };
  });

export const deleteUserProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    reason: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Deleting user ${input.userId}:`, input.reason);
    return { success: true };
  });

export const getUserActivityProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    limit: z.number().min(1).max(50).default(20),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database query
    return [
      {
        id: '1',
        type: 'post_created',
        description: 'Created a new post about Pizza Palace',
        timestamp: '2024-01-20T15:30:00Z',
        metadata: { postId: 'post_123', restaurantName: 'Pizza Palace' },
      },
      {
        id: '2',
        type: 'comment_created',
        description: 'Commented on a post',
        timestamp: '2024-01-20T14:15:00Z',
        metadata: { postId: 'post_456', commentText: 'Great food!' },
      },
      {
        id: '3',
        type: 'user_followed',
        description: 'Started following chef_maria',
        timestamp: '2024-01-20T12:00:00Z',
        metadata: { followedUserId: '2', followedUsername: 'chef_maria' },
      },
    ].slice(0, input.limit);
  });