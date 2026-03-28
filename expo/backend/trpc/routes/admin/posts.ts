import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import type { Post } from '@/types/restaurant';

export const getAdminPostsProcedure = publicProcedure
  .input(z.object({
    search: z.string().optional(),
    status: z.enum(['all', 'flagged', 'approved', 'removed']).default('all'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const posts: (Post & { status?: string })[] = [
      {
        id: '1',
        userId: 'user_123',
        user: {
          id: 'user_123',
          username: 'foodie_john',
          displayName: 'John Smith',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
          bio: 'Food enthusiast',
          followersCount: 1250,
          followingCount: 340,
          postsCount: 89,
          badges: ['verified'],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        type: 'review',
        content: {
          text: 'Amazing pizza at this place! The crust was perfectly crispy and the toppings were fresh.',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'],
        },
        restaurant: {
          id: 'rest_456',
          name: 'Pizza Palace',
          location: 'Downtown',
        },
        ratings: {
          food: 5,
          service: 4,
          ambiance: 4,
          cleanliness: 5,
          overall: 4.5,
        },
        tags: ['pizza', 'italian', 'delicious'],
        likesCount: 45,
        commentsCount: 12,
        sharesCount: 3,
        isLiked: false,
        createdAt: '2024-01-20T10:30:00Z',
        status: 'approved',
      },
      {
        id: '2',
        userId: 'user_456',
        user: {
          id: 'user_456',
          username: 'angry_reviewer',
          displayName: 'Angry Reviewer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
          bio: '',
          followersCount: 10,
          followingCount: 5,
          postsCount: 2,
          badges: [],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        type: 'review',
        content: {
          text: 'This place is absolutely terrible! The food was cold and the service was rude. I would never recommend this to anyone!',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'],
        },
        restaurant: {
          id: 'rest_789',
          name: 'Local Bistro',
          location: 'Midtown',
        },
        ratings: {
          food: 1,
          service: 1,
          ambiance: 1,
          cleanliness: 1,
          overall: 1,
        },
        tags: ['disappointing', 'bad-service'],
        likesCount: 2,
        commentsCount: 8,
        sharesCount: 0,
        isLiked: false,
        createdAt: '2024-01-20T09:15:00Z',
        status: 'flagged',
      },
    ];

    let filtered = posts;
    
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.content.text?.toLowerCase().includes(searchLower) ||
        p.user.displayName.toLowerCase().includes(searchLower) ||
        p.restaurant?.name.toLowerCase().includes(searchLower)
      );
    }

    if (input.status !== 'all') {
      filtered = filtered.filter(p => p.status === input.status);
    }

    return {
      posts: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
      hasMore: input.offset + input.limit < filtered.length,
    };
  });

export const deletePostProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
    reason: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Deleting post ${input.postId}:`, input.reason);
    return { success: true };
  });

export const getPostDetailsProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database query
    return {
      id: input.postId,
      userId: 'user_123',
      user: {
        id: 'user_123',
        username: 'foodie_john',
        displayName: 'John Smith',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        bio: 'Food enthusiast',
        followersCount: 1250,
        followingCount: 340,
        postsCount: 89,
        badges: ['verified'],
        preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
      },
      type: 'review' as const,
      content: {
        text: 'Amazing pizza at this place! The crust was perfectly crispy and the toppings were fresh.',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'],
      },
      restaurant: {
        id: 'rest_456',
        name: 'Pizza Palace',
        location: 'Downtown',
      },
      ratings: {
        food: 5,
        service: 4,
        ambiance: 4,
        cleanliness: 5,
        overall: 4.5,
      },
      tags: ['pizza', 'italian', 'delicious'],
      likesCount: 45,
      commentsCount: 12,
      sharesCount: 3,
      isLiked: false,
      createdAt: '2024-01-20T10:30:00Z',
      status: 'approved',
    };
  });