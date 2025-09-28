import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Create a post
export const createPostProcedure = protectedProcedure
  .input(z.object({
    content: z.string().min(1),
    images: z.array(z.string().url()).optional(),
    restaurant_id: z.string().optional(),
    type: z.enum(['text', 'image', 'review']).default('text'),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: post, error } = await ctx.supabase
      .from('posts')
      .insert({
        user_id: ctx.user.id,
        content: input.content,
        images: input.images,
        restaurant_id: input.restaurant_id,
        type: input.type,
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        content,
        images,
        restaurant_id,
        type,
        created_at,
        profiles!inner(id, display_name, avatar_url),
        restaurants(id, name, image_url)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create post' });
    }

    return post;
  });

// Get posts feed
export const getPostsFeedProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
    user_id: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    let query = ctx.supabase
      .from('posts')
      .select(`
        id,
        content,
        images,
        restaurant_id,
        type,
        created_at,
        profiles!inner(id, display_name, avatar_url),
        restaurants(id, name, image_url),
        post_likes(count),
        comments(count)
      `)
      .range(input.offset, input.offset + input.limit - 1);

    if (input.user_id) {
      query = query.eq('user_id', input.user_id);
    }

    const { data: posts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch posts' });
    }

    return posts || [];
  });

// Get post by ID
export const getPostByIdProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: post, error } = await ctx.supabase
      .from('posts')
      .select(`
        id,
        content,
        images,
        restaurant_id,
        type,
        created_at,
        profiles!inner(id, display_name, avatar_url),
        restaurants(id, name, image_url),
        post_likes(count),
        comments(count)
      `)
      .eq('id', input.id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }

    return post;
  });

// Update own post
export const updatePostProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    content: z.string().min(1).optional(),
    images: z.array(z.string().url()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { id, ...updateData } = input;

    const { data: post, error } = await ctx.supabase
      .from('posts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', ctx.user.id) // Ensure user can only update their own posts
      .select(`
        id,
        content,
        images,
        restaurant_id,
        type,
        created_at,
        updated_at,
        profiles!inner(id, display_name, avatar_url),
        restaurants(id, name, image_url)
      `)
      .single();

    if (error) {
      console.error('Error updating post:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update post' });
    }

    if (!post) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found or not authorized' });
    }

    return post;
  });

// Delete own post
export const deletePostProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { error } = await ctx.supabase
      .from('posts')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.user.id); // Ensure user can only delete their own posts

    if (error) {
      console.error('Error deleting post:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete post' });
    }

    return { success: true };
  });