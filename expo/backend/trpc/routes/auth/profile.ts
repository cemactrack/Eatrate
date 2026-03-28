import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Get current user profile
export const getCurrentProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.supabase) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
  }

  const { data: profile, error } = await ctx.supabase
    .from('profiles')
    .select('*')
    .eq('id', ctx.user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile' });
  }

  return profile;
});

// Update user profile
export const updateProfileProcedure = protectedProcedure
  .input(z.object({
    display_name: z.string().optional(),
    bio: z.string().optional(),
    avatar_url: z.string().url().optional(),
    location: z.string().optional(),
    website: z.string().url().optional(),
    phone: z.string().optional(),
    preferences: z.record(z.any()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: profile, error } = await ctx.supabase
      .from('profiles')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' });
    }

    return profile;
  });

// Update push token
export const updatePushTokenProcedure = protectedProcedure
  .input(z.object({
    pushToken: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: profile, error } = await ctx.supabase
      .from('profiles')
      .update({
        push_token: input.pushToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating push token:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update push token' });
    }

    console.log('[Push Token] Updated for user:', ctx.user.id);
    return profile;
  });

// Get profile by user ID (public)
export const getProfileByIdProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: profile, error } = await ctx.supabase
      .from('profiles')
      .select('id, display_name, bio, avatar_url, location, website, created_at')
      .eq('id', input.userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
    }

    return profile;
  });