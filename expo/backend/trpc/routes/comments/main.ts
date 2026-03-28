import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Create a comment
export const createCommentProcedure = protectedProcedure
  .input(z.object({
    post_id: z.string().min(1, 'Post ID is required'),
    text: z.string().min(1, 'Comment text is required and cannot be empty'),
    parent_id: z.string().optional(), // For nested comments
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: comment, error } = await ctx.supabase
      .from('comments')
      .insert({
        user_id: ctx.user.id,
        post_id: input.post_id,
        content: input.text,
        parent_id: input.parent_id,
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        content,
        parent_id,
        created_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create comment' });
    }

    return comment;
  });

// Get comments by post ID
export const getCommentsByPostProcedure = publicProcedure
  .input(z.object({
    post_id: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: comments, error } = await ctx.supabase
      .from('comments')
      .select(`
        id,
        content,
        parent_id,
        created_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .eq('post_id', input.post_id)
      .range(input.offset, input.offset + input.limit - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch comments' });
    }

    return comments || [];
  });

// Update own comment
export const updateCommentProcedure = protectedProcedure
  .input(z.object({
    id: z.string().min(1, 'Comment ID is required'),
    text: z.string().min(1, 'Comment text is required and cannot be empty'),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: comment, error } = await ctx.supabase
      .from('comments')
      .update({
        content: input.text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .eq('user_id', ctx.user.id) // Ensure user can only update their own comments
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update comment' });
    }

    if (!comment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found or not authorized' });
    }

    return comment;
  });

// Delete own comment
export const deleteCommentProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { error } = await ctx.supabase
      .from('comments')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.user.id); // Ensure user can only delete their own comments

    if (error) {
      console.error('Error deleting comment:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete comment' });
    }

    return { success: true };
  });