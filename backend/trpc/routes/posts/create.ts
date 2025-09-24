import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

const postsStorage = new Map<string, any>();
let postIdCounter = 1000;

export const createPostProcedure = protectedProcedure
  .input(z.object({
    text: z.string().min(1).max(500),
    restaurantId: z.string().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    ratings: z.object({
      food: z.number().min(1).max(5),
      service: z.number().min(1).max(5),
      ambiance: z.number().min(1).max(5),
      cleanliness: z.number().min(1).max(5),
    }),
    tags: z.array(z.string()).optional(),
    category: z.enum(['review', 'photo', 'video', 'story']).default('review'),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    }).optional(),
    scheduledFor: z.string().optional(), // ISO date string
    isDraft: z.boolean().default(false),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating post:', input);
    
    const postId = String(postIdCounter++);
    const now = new Date().toISOString();
    
    const post = {
      id: postId,
      userId: ctx.user?.id || 'anonymous',
      user: {
        id: ctx.user?.id || 'anonymous',
        username: `user_${ctx.user?.id || 'anonymous'}`,
        displayName: `User ${ctx.user?.id || 'Anonymous'}`,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
        bio: 'Food enthusiast',
        followersCount: 0,
        followingCount: 0,
        postsCount: 1,
        badges: [],
        preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
      },
      type: input.category,
      content: {
        text: input.text,
        images: input.images || [],
        videos: input.videos || [],
      },
      restaurant: input.restaurantId ? {
        id: input.restaurantId,
        name: 'Selected Restaurant',
        location: 'Location',
      } : undefined,
      ratings: {
        ...input.ratings,
        overall: Math.round((input.ratings.food * 0.4 + input.ratings.service * 0.3 + input.ratings.ambiance * 0.2 + input.ratings.cleanliness * 0.1) * 10) / 10,
      },
      tags: input.tags || [],
      location: input.location,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: now,
      updatedAt: now,
      scheduledFor: input.scheduledFor,
      isDraft: input.isDraft,
      status: input.isDraft ? 'draft' : (input.scheduledFor ? 'scheduled' : 'published'),
    };
    
    postsStorage.set(postId, post);
    
    return { 
      id: postId, 
      status: post.status,
      message: input.isDraft ? 'Draft saved' : (input.scheduledFor ? 'Post scheduled' : 'Post created successfully')
    };
  });

export const updatePostProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(),
    text: z.string().min(1).max(500).optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    scheduledFor: z.string().optional(),
    isDraft: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const post = postsStorage.get(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== ctx.user?.id) {
      throw new Error('Unauthorized');
    }
    
    const updatedPost = {
      ...post,
      content: {
        ...post.content,
        ...(input.text !== undefined && { text: input.text }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.videos !== undefined && { videos: input.videos }),
      },
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.scheduledFor !== undefined && { scheduledFor: input.scheduledFor }),
      ...(input.isDraft !== undefined && { isDraft: input.isDraft }),
      updatedAt: new Date().toISOString(),
    };
    
    postsStorage.set(input.postId, updatedPost);
    
    return { 
      id: input.postId, 
      message: 'Post updated successfully' 
    };
  });

export const deletePostProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const post = postsStorage.get(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== ctx.user?.id) {
      throw new Error('Unauthorized');
    }
    
    postsStorage.delete(input.postId);
    
    return { 
      id: input.postId, 
      message: 'Post deleted successfully' 
    };
  });

export const getUserPostsProcedure = protectedProcedure
  .input(z.object({
    userId: z.string().optional(),
    status: z.enum(['all', 'published', 'draft', 'scheduled']).default('published'),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    const targetUserId = input.userId || ctx.user?.id;
    const allPosts = Array.from(postsStorage.values());
    
    let filteredPosts = allPosts.filter(post => {
      if (post.userId !== targetUserId) return false;
      if (input.status === 'all') return true;
      return post.status === input.status;
    });
    
    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const paginatedPosts = filteredPosts.slice(input.offset, input.offset + input.limit);
    
    return {
      posts: paginatedPosts,
      total: filteredPosts.length,
      hasMore: input.offset + input.limit < filteredPosts.length,
    };
  });