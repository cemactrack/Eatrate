import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// Create a review
export const createReviewProcedure = protectedProcedure
  .input(z.object({
    restaurant_id: z.string().min(1, 'Restaurant ID is required'),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    text: z.string().optional(),
    photos: z.array(z.string().url('Invalid photo URL format')).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    // Check if user already reviewed this restaurant
    const { data: existingReview } = await ctx.supabase
      .from('reviews')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('restaurant_id', input.restaurant_id)
      .single();

    if (existingReview) {
      throw new TRPCError({ code: 'CONFLICT', message: 'You have already reviewed this restaurant' });
    }

    const { data: review, error } = await ctx.supabase
      .from('reviews')
      .insert({
        user_id: ctx.user.id,
        restaurant_id: input.restaurant_id,
        rating: input.rating,
        comment: input.text,
        images: input.photos,
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        rating,
        comment,
        images,
        created_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating review:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create review' });
    }

    return review;
  });

// Get reviews by restaurant ID
export const getReviewsByRestaurantProcedure = publicProcedure
  .input(z.object({
    restaurant_id: z.string(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: reviews, error } = await ctx.supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        images,
        created_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .eq('restaurant_id', input.restaurant_id)
      .range(input.offset, input.offset + input.limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch reviews' });
    }

    return reviews || [];
  });

// Update own review
export const updateReviewProcedure = protectedProcedure
  .input(z.object({
    id: z.string().min(1, 'Review ID is required'),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
    text: z.string().optional(),
    photos: z.array(z.string().url('Invalid photo URL format')).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { id, text, photos, ...updateData } = input;
    const mappedUpdateData = {
      ...updateData,
      ...(text !== undefined && { comment: text }),
      ...(photos !== undefined && { images: photos }),
    };

    const { data: review, error } = await ctx.supabase
      .from('reviews')
      .update({
        ...mappedUpdateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', ctx.user.id) // Ensure user can only update their own reviews
      .select(`
        id,
        rating,
        comment,
        images,
        created_at,
        updated_at,
        profiles!inner(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating review:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update review' });
    }

    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found or not authorized' });
    }

    return review;
  });

// Delete own review
export const deleteReviewProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { error } = await ctx.supabase
      .from('reviews')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.user.id); // Ensure user can only delete their own reviews

    if (error) {
      console.error('Error deleting review:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete review' });
    }

    return { success: true };
  });