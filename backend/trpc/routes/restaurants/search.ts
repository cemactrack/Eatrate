import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";

export const searchRestaurantsProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().optional(),
      location: z.enum(['all', 'douala', 'yaounde', 'buea', 'limbe']).optional().default('all'),
      cuisine: z.string().optional(),
      priceRange: z.array(z.enum(['$', '$$', '$$$', '$$$$'])).optional().default([]),
      rating: z.number().min(0).max(5).optional().default(0),
      isOpen: z.boolean().optional(),
      sortBy: z.enum(['name', 'rating', 'reviewCount', 'distance']).optional().default('rating'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    })
  )
  .query(async ({ input }) => {
    console.log('[tRPC] Search restaurants with filters:', input);
    
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }
      
      let query = supabaseAdmin
        .from('restaurants')
        .select('*', { count: 'exact' });
      
      // Apply location filter
      if (input.location !== 'all') {
        query = query.ilike('address', `%${input.location}%`);
      }
      
      // Apply search query filter
      if (input.query) {
        query = query.or(`name.ilike.%${input.query}%,cuisine.ilike.%${input.query}%,address.ilike.%${input.query}%`);
      }
      
      // Apply cuisine filter
      if (input.cuisine && input.cuisine !== 'All') {
        query = query.ilike('cuisine', `%${input.cuisine}%`);
      }
      
      // Apply price range filter
      if (input.priceRange && input.priceRange.length > 0) {
        query = query.in('price_range', input.priceRange);
      }
      
      // Apply rating filter
      if (input.rating && input.rating > 0) {
        query = query.gte('rating', input.rating);
      }
      
      // Apply open status filter
      if (input.isOpen !== undefined) {
        query = query.eq('is_open', input.isOpen);
      }
      
      // Apply sorting
      const sortColumn = input.sortBy === 'reviewCount' ? 'review_count' : input.sortBy;
      query = query.order(sortColumn, { ascending: input.sortOrder === 'asc' });
      
      // Apply pagination
      query = query.range(input.offset, input.offset + input.limit - 1);
      
      const { data: restaurants, error, count } = await query;
      
      if (error) {
        console.error('[tRPC] Restaurant search error:', error);
        throw new Error('Failed to search restaurants');
      }
      
      const mapped = (restaurants || []).map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || 'International',
        rating: r.rating || 0,
        reviewCount: r.review_count || 0,
        image: r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        address: r.address || '',
        priceRange: r.price_range || '$' as const,
        isOpen: r.is_open ?? true,
        tags: r.tags || [],
      }));
      
      // Get available cuisines for filtering
      const { data: cuisineData } = await supabaseAdmin
        .from('restaurants')
        .select('cuisine')
        .not('cuisine', 'is', null);
      
      const cuisines = Array.from(new Set(
        (cuisineData || []).map(r => r.cuisine).filter(Boolean)
      )).sort();
      
      const total = count || 0;
      
      return {
        restaurants: mapped,
        total,
        offset: input.offset,
        limit: input.limit,
        hasMore: input.offset + input.limit < total,
        cuisines: ['All', ...cuisines],
        filters: input,
        sources: {
          douala: input.location === 'all' || input.location === 'douala',
          yaounde: input.location === 'all' || input.location === 'yaounde',
          buea: input.location === 'all' || input.location === 'buea',
          limbe: input.location === 'all' || input.location === 'limbe',
        }
      };
      
    } catch (error: any) {
      console.error('[tRPC] Search restaurants failed:', error);
      return {
        restaurants: [],
        total: 0,
        offset: input.offset,
        limit: input.limit,
        hasMore: false,
        cuisines: ['All'],
        filters: input,
        error: error.message || 'Search failed',
        sources: {
          douala: false,
          yaounde: false,
          buea: false,
          limbe: false,
        }
      };
    }
  });