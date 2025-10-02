import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

// List restaurants with optional filters
export const listRestaurantsProcedure = publicProcedure
  .input(z.object({
    city: z.string().optional(),
    cuisine: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    let query = ctx.supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        cuisine,
        city,
        address,
        phone,
        website,
        image_url,
        rating,
        price_range,
        opening_hours,
        created_at,
        updated_at
      `)
      .range(input.offset, input.offset + input.limit - 1);

    if (input.city) {
      query = query.eq('city', input.city);
    }

    if (input.cuisine) {
      query = query.eq('cuisine', input.cuisine);
    }

    const { data: restaurants, error } = await query.order('rating', { ascending: false });

    if (error) {
      console.error('[tRPC] restaurants.list error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        filters: { city: input.city, cuisine: input.cuisine }
      });
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: `Failed to fetch restaurants: ${error.message}` 
      });
    }

    console.log(`[tRPC] restaurants.list: Found ${restaurants?.length || 0} restaurants`);
    return restaurants || [];
  });

// Get restaurant by ID
export const getRestaurantByIdProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const { data: restaurant, error } = await ctx.supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        cuisine,
        city,
        address,
        phone,
        website,
        image_url,
        rating,
        price_range,
        opening_hours,
        created_at,
        updated_at
      `)
      .eq('id', input.id)
      .single();

    if (error) {
      console.error('Error fetching restaurant:', error);
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurant not found' });
    }

    return restaurant;
  });

// Search restaurants by name or cuisine
export const searchRestaurantsProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(1, 'Search query is required and cannot be empty'),
    city: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }))
  .query(async ({ ctx, input }) => {
    if (!ctx.supabase) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    let query = ctx.supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        cuisine,
        city,
        address,
        phone,
        website,
        image_url,
        rating,
        price_range,
        opening_hours
      `)
      .or(`name.ilike.%${input.query}%,cuisine.ilike.%${input.query}%,description.ilike.%${input.query}%`)
      .limit(input.limit);

    if (input.city) {
      query = query.eq('city', input.city);
    }

    const { data: restaurants, error } = await query.order('rating', { ascending: false });

    if (error) {
      console.error('Error searching restaurants:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to search restaurants' });
    }

    return restaurants || [];
  });