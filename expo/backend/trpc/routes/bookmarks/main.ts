import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Add/remove restaurant bookmark
export const toggleRestaurantBookmarkProcedure = protectedProcedure
  .input(z.object({
    restaurant_id: z.string().min(1, 'Restaurant ID is required'),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await ctx.supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('restaurant_id', input.restaurant_id)
      .single();

    if (existingBookmark) {
      // Remove bookmark
      const { error } = await ctx.supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', ctx.user.id)
        .eq('restaurant_id', input.restaurant_id);

      if (error) {
        console.error('Error removing bookmark:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to remove bookmark' });
      }

      return { bookmarked: false };
    } else {
      // Add bookmark
      const { error } = await ctx.supabase
        .from('bookmarks')
        .insert({
          user_id: ctx.user.id,
          restaurant_id: input.restaurant_id,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to add bookmark' });
      }

      return { bookmarked: true };
    }
  });

// Get user's bookmarked restaurants
export const getBookmarkedRestaurantsProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: bookmarks, error } = await ctx.supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        restaurants!inner(
          id,
          name,
          description,
          cuisine,
          city,
          address,
          image_url,
          rating,
          price_range
        )
      `)
      .eq('user_id', ctx.user.id)
      .range(input.offset, input.offset + input.limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch bookmarks' });
    }

    return bookmarks || [];
  });

// Check if restaurant is bookmarked
export const isRestaurantBookmarkedProcedure = protectedProcedure
  .input(z.object({
    restaurant_id: z.string().min(1, 'Restaurant ID is required'),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: bookmark } = await ctx.supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('restaurant_id', input.restaurant_id)
      .single();

    return { bookmarked: !!bookmark };
  });