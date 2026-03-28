import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import type { Post, Comment } from '@/types/restaurant';
import type { AdminReport } from '@/types/admin';

export const getFlaggedContentProcedure = publicProcedure
  .input(z.object({
    type: z.enum(['posts', 'comments', 'all']).default('all'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const flaggedPosts: Post[] = [
      {
        id: '1',
        userId: 'user_123',
        user: {
          id: 'user_123',
          username: 'problematic_user',
          displayName: 'Problem User',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          bio: '',
          followersCount: 50,
          followingCount: 20,
          postsCount: 5,
          badges: [],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        type: 'review',
        content: {
          text: 'This restaurant is terrible and the staff are rude!',
          images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'],
        },
        restaurant: {
          id: 'rest_456',
          name: 'Local Bistro',
          location: 'Downtown',
        },
        ratings: {
          food: 1,
          service: 1,
          ambiance: 1,
          cleanliness: 1,
          overall: 1,
        },
        tags: ['disappointing', 'overpriced'],
        likesCount: 2,
        commentsCount: 8,
        sharesCount: 0,
        isLiked: false,
        createdAt: '2024-01-20T10:30:00Z',
      },
    ];

    const flaggedComments: Comment[] = [
      {
        id: '1',
        postId: 'post_789',
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
        text: 'This place should be shut down immediately!',
        likesCount: 0,
        isLiked: false,
        createdAt: '2024-01-20T11:15:00Z',
      },
    ];

    return {
      posts: input.type === 'comments' ? [] : flaggedPosts.slice(input.offset, input.offset + input.limit),
      comments: input.type === 'posts' ? [] : flaggedComments.slice(input.offset, input.offset + input.limit),
      total: (input.type === 'comments' ? 0 : flaggedPosts.length) + (input.type === 'posts' ? 0 : flaggedComments.length),
    };
  });

export const getReportsProcedure = publicProcedure
  .input(z.object({
    status: z.enum(['all', 'pending', 'reviewed', 'resolved', 'dismissed']).default('pending'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const reports: AdminReport[] = [
      {
        id: '1',
        type: 'post',
        targetId: 'post_123',
        reporterId: 'user_789',
        reporterName: 'Concerned User',
        reason: 'Inappropriate content',
        description: 'This post contains offensive language and false information about the restaurant.',
        status: 'pending',
        createdAt: '2024-01-20T09:30:00Z',
      },
      {
        id: '2',
        type: 'comment',
        targetId: 'comment_456',
        reporterId: 'user_101',
        reporterName: 'Regular Customer',
        reason: 'Spam',
        description: 'This comment is clearly spam and not related to the restaurant.',
        status: 'pending',
        createdAt: '2024-01-20T08:15:00Z',
      },
      {
        id: '3',
        type: 'user',
        targetId: 'user_202',
        reporterId: 'user_303',
        reporterName: 'Restaurant Owner',
        reason: 'Harassment',
        description: 'This user has been posting fake negative reviews about my restaurant.',
        status: 'reviewed',
        assignedTo: 'admin_1',
        createdAt: '2024-01-19T16:45:00Z',
      },
    ];

    const filtered = input.status === 'all' ? reports : reports.filter(r => r.status === input.status);
    return {
      reports: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
    };
  });

export const updateReportStatusProcedure = publicProcedure
  .input(z.object({
    reportId: z.string(),
    status: z.enum(['reviewed', 'resolved', 'dismissed']),
    adminNotes: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Updating report ${input.reportId} status to ${input.status}`, input.adminNotes);
    return { success: true };
  });

export const moderateContentProcedure = publicProcedure
  .input(z.object({
    contentType: z.enum(['post', 'comment']),
    contentId: z.string(),
    action: z.enum(['approve', 'remove', 'flag']),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Moderating ${input.contentType} ${input.contentId}: ${input.action}`, input.reason);
    return { success: true };
  });

export const bulkModerateProcedure = publicProcedure
  .input(z.object({
    items: z.array(z.object({
      type: z.enum(['post', 'comment']),
      id: z.string(),
      action: z.enum(['approve', 'remove', 'flag']),
    })),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Bulk moderating ${input.items.length} items`, input.reason);
    return { success: true, processed: input.items.length };
  });