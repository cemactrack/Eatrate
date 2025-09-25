import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

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
      // Mock data for demonstration - in real app this would fetch from database
      const mockRestaurants = [
        {
          id: 'mock-1',
          name: 'Le Beau Restaurant',
          cuisine: 'French',
          rating: 4.5,
          reviewCount: 120,
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
          address: 'Douala, Cameroon',
          priceRange: '$$$' as const,
          isOpen: true,
          tags: ['French', 'Fine Dining', 'Romantic'],
        },
        {
          id: 'mock-2',
          name: 'Mama Africa Kitchen',
          cuisine: 'African',
          rating: 4.2,
          reviewCount: 85,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
          address: 'Yaoundé, Cameroon',
          priceRange: '$$' as const,
          isOpen: true,
          tags: ['African', 'Traditional', 'Local'],
        },
        {
          id: 'mock-3',
          name: 'Pizza Corner',
          cuisine: 'Italian',
          rating: 3.8,
          reviewCount: 65,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
          address: 'Buea, Cameroon',
          priceRange: '$$' as const,
          isOpen: false,
          tags: ['Italian', 'Pizza', 'Casual'],
        },
        {
          id: 'mock-4',
          name: 'Sushi Zen',
          cuisine: 'Japanese',
          rating: 4.7,
          reviewCount: 95,
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
          address: 'Limbe, Cameroon',
          priceRange: '$$$$' as const,
          isOpen: true,
          tags: ['Japanese', 'Sushi', 'Fresh'],
        },
        {
          id: 'mock-5',
          name: 'Burger Palace',
          cuisine: 'American',
          rating: 3.9,
          reviewCount: 150,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
          address: 'Douala, Cameroon',
          priceRange: '$' as const,
          isOpen: true,
          tags: ['American', 'Burgers', 'Fast Food'],
        },
      ];
      
      let filteredRestaurants = [...mockRestaurants];
      
      // Apply location filter
      if (input.location !== 'all') {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.address.toLowerCase().includes(input.location!)
        );
      }
      
      // Apply search query filter
      if (input.query) {
        const query = input.query.toLowerCase();
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.cuisine.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query) ||
          restaurant.tags.some((tag: string) => tag.toLowerCase().includes(query))
        );
      }
      
      // Apply cuisine filter
      if (input.cuisine && input.cuisine !== 'All') {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.cuisine === input.cuisine
        );
      }
      
      // Apply price range filter
      if (input.priceRange && input.priceRange.length > 0) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          input.priceRange!.includes(restaurant.priceRange)
        );
      }
      
      // Apply rating filter
      if (input.rating && input.rating > 0) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.rating >= input.rating!
        );
      }
      
      // Apply open status filter
      if (input.isOpen !== undefined) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.isOpen === input.isOpen
        );
      }
      
      // Sort results
      filteredRestaurants.sort((a, b) => {
        let comparison = 0;
        
        switch (input.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
          case 'reviewCount':
            comparison = a.reviewCount - b.reviewCount;
            break;
          case 'distance':
            // Mock distance sorting - in real app would use actual location
            comparison = Math.random() - 0.5;
            break;
          default:
            comparison = 0;
        }
        
        return input.sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // Apply pagination
      const total = filteredRestaurants.length;
      const paginatedRestaurants = filteredRestaurants.slice(
        input.offset,
        input.offset + input.limit
      );
      
      // Get available cuisines for filtering
      const cuisines = Array.from(new Set(
        mockRestaurants.map(r => r.cuisine)
      )).sort();
      
      return {
        restaurants: paginatedRestaurants,
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