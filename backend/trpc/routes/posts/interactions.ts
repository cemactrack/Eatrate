import { z } from "zod";
import { protectedProcedure, publicProcedure } from "@/backend/trpc/create-context";

const bookmarksStorage = new Map<string, Set<string>>(); // userId -> Set of postIds
const sharesStorage = new Map<string, number>(); // postId -> share count
const viewsStorage = new Map<string, Set<string>>(); // postId -> Set of userIds who viewed
const reportsStorage = new Map<string, any[]>(); // postId -> reports array

export const bookmarkPostProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(({ input, ctx }) => {
    const userId = ctx.user!.id;
    const userBookmarks = bookmarksStorage.get(userId) ?? new Set<string>();
    
    const wasBookmarked = userBookmarks.has(input.postId);
    
    if (wasBookmarked) {
      userBookmarks.delete(input.postId);
    } else {
      userBookmarks.add(input.postId);
    }
    
    bookmarksStorage.set(userId, userBookmarks);
    
    return { 
      bookmarked: !wasBookmarked,
      message: !wasBookmarked ? 'Post bookmarked' : 'Bookmark removed'
    };
  });

export const getBookmarkedPostsProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(({ input, ctx }) => {
    const userId = ctx.user!.id;
    const userBookmarks = bookmarksStorage.get(userId) ?? new Set<string>();
    const bookmarkedPostIds = Array.from(userBookmarks);
    
    // In a real app, you'd fetch the actual posts from storage
    const mockPosts = bookmarkedPostIds.slice(input.offset, input.offset + input.limit).map(postId => ({
      id: postId,
      title: `Bookmarked Post ${postId}`,
      createdAt: new Date().toISOString(),
    }));
    
    return {
      posts: mockPosts,
      total: bookmarkedPostIds.length,
      hasMore: input.offset + input.limit < bookmarkedPostIds.length,
    };
  });

export const sharePostProcedure = protectedProcedure
  .input(z.object({ 
    postId: z.string(),
    platform: z.enum(['facebook', 'twitter', 'instagram', 'whatsapp', 'copy_link']).optional(),
  }))
  .mutation(({ input }) => {
    const currentShares = sharesStorage.get(input.postId) ?? 0;
    sharesStorage.set(input.postId, currentShares + 1);
    
    return { 
      sharesCount: currentShares + 1,
      message: 'Post shared successfully'
    };
  });

export const recordPostViewProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(({ input, ctx }) => {
    const userId = ctx.user!.id;
    const postViews = viewsStorage.get(input.postId) ?? new Set<string>();
    postViews.add(userId);
    viewsStorage.set(input.postId, postViews);
    
    return { 
      viewsCount: postViews.size,
      message: 'View recorded'
    };
  });

export const reportPostProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(),
    reason: z.enum(['spam', 'inappropriate', 'harassment', 'fake_review', 'copyright', 'other']),
    description: z.string().max(500).optional(),
  }))
  .mutation(({ input, ctx }) => {
    const postReports = reportsStorage.get(input.postId) ?? [];
    
    const report = {
      id: `report_${Date.now()}`,
      postId: input.postId,
      reporterId: ctx.user!.id,
      reason: input.reason,
      description: input.description,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    postReports.push(report);
    reportsStorage.set(input.postId, postReports);
    
    return { 
      reportId: report.id,
      message: 'Report submitted successfully'
    };
  });

export const searchPostsProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(1).max(100),
    filters: z.object({
      category: z.enum(['review', 'photo', 'video', 'story']).optional(),
      tags: z.array(z.string()).optional(),
      dateRange: z.object({
        from: z.string(),
        to: z.string(),
      }).optional(),
      rating: z.object({
        min: z.number().min(1).max(5),
        max: z.number().min(1).max(5),
      }).optional(),
    }).optional(),
    sortBy: z.enum(['relevance', 'date', 'likes', 'comments']).default('relevance'),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock search implementation
    const mockResults = Array.from({ length: Math.min(input.limit, 10) }, (_, i) => ({
      id: `search_${input.offset + i + 1}`,
      userId: `user_${i + 1}`,
      user: {
        id: `user_${i + 1}`,
        username: `user_${i + 1}`,
        displayName: `User ${i + 1}`,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
        bio: 'Food enthusiast',
        followersCount: 100 + i * 50,
        followingCount: 50 + i * 20,
        postsCount: 10 + i * 5,
        badges: [],
        preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
      },
      type: 'review' as const,
      content: {
        text: `Search result for "${input.query}" - Post ${input.offset + i + 1}`,
        images: [`https://picsum.photos/seed/search${i}/800/600`],
      },
      ratings: {
        food: 4,
        service: 4,
        ambiance: 4,
        cleanliness: 4,
        overall: 4,
      },
      tags: ['search', 'result'],
      likesCount: 50 + i * 10,
      commentsCount: 10 + i * 2,
      sharesCount: 5 + i,
      viewsCount: 100 + i * 20,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
    
    return {
      posts: mockResults,
      total: 100, // Mock total
      hasMore: input.offset + input.limit < 100,
      query: input.query,
      filters: input.filters,
    };
  });

export const getPostAnalyticsProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(),
    timeRange: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
  }))
  .query(({ input, ctx }) => {
    // Mock analytics data
    const views = viewsStorage.get(input.postId)?.size ?? 0;
    const shares = sharesStorage.get(input.postId) ?? 0;
    
    return {
      postId: input.postId,
      timeRange: input.timeRange,
      metrics: {
        views: views,
        likes: Math.floor(views * 0.1),
        comments: Math.floor(views * 0.05),
        shares: shares,
        bookmarks: Math.floor(views * 0.02),
        engagement_rate: Math.round((views * 0.15) * 100) / 100,
      },
      demographics: {
        age_groups: {
          '18-24': 25,
          '25-34': 35,
          '35-44': 25,
          '45-54': 10,
          '55+': 5,
        },
        locations: {
          'Douala': 40,
          'Yaoundé': 30,
          'Buea': 15,
          'Limbe': 10,
          'Other': 5,
        },
      },
      timeline: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        likes: Math.floor(Math.random() * 10) + 1,
        comments: Math.floor(Math.random() * 5),
      })).reverse(),
    };
  });