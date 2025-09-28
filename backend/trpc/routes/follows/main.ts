import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Follow/unfollow a user
export const toggleFollowUserProcedure = protectedProcedure
  .input(z.object({
    target_user_id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    if (ctx.user.id === input.target_user_id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });
    }

    // Check if already following
    const { data: existingFollow } = await ctx.supabase
      .from('follows')
      .select('id')
      .eq('follower_id', ctx.user.id)
      .eq('following_id', input.target_user_id)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await ctx.supabase
        .from('follows')
        .delete()
        .eq('follower_id', ctx.user.id)
        .eq('following_id', input.target_user_id);

      if (error) {
        console.error('Error unfollowing user:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to unfollow user' });
      }

      return { following: false };
    } else {
      // Follow
      const { error } = await ctx.supabase
        .from('follows')
        .insert({
          follower_id: ctx.user.id,
          following_id: input.target_user_id,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error following user:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to follow user' });
      }

      return { following: true };
    }
  });

// Get followers of a user
export const getFollowersProcedure = protectedProcedure
  .input(z.object({
    user_id: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: followers, error } = await ctx.supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        profiles!follows_follower_id_fkey(id, display_name, avatar_url)
      `)
      .eq('following_id', input.user_id)
      .range(input.offset, input.offset + input.limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching followers:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch followers' });
    }

    return followers || [];
  });

// Get users that a user is following
export const getFollowingProcedure = protectedProcedure
  .input(z.object({
    user_id: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: following, error } = await ctx.supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        profiles!follows_following_id_fkey(id, display_name, avatar_url)
      `)
      .eq('follower_id', input.user_id)
      .range(input.offset, input.offset + input.limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching following:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch following' });
    }

    return following || [];
  });

// Get follow stats for a user
export const getFollowStatsProcedure = protectedProcedure
  .input(z.object({
    user_id: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    // Get follower count
    const { count: followersCount, error: followersError } = await ctx.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', input.user_id);

    if (followersError) {
      console.error('Error fetching followers count:', followersError);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch followers count' });
    }

    // Get following count
    const { count: followingCount, error: followingError } = await ctx.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', input.user_id);

    if (followingError) {
      console.error('Error fetching following count:', followingError);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch following count' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (ctx.user.id !== input.user_id) {
      const { data: followRelation } = await ctx.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', ctx.user.id)
        .eq('following_id', input.user_id)
        .single();

      isFollowing = !!followRelation;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing,
    };
  });