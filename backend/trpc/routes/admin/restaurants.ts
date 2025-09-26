import { z } from 'zod';
import { publicProcedure } from '../../create-context';

interface AdminRestaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  reviewsCount: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  cuisine: string;
  location: string;
  address: string;
  phone: string;
  website: string;
  hours: Record<string, string>;
  features: string[];
  tags: string[];
  status: 'verified' | 'pending' | 'rejected';
}

export const getAdminRestaurantsProcedure = publicProcedure
  .input(z.object({
    search: z.string().optional(),
    status: z.enum(['all', 'verified', 'pending', 'rejected']).default('all'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const restaurants: AdminRestaurant[] = [
      {
        id: '1',
        name: 'Pizza Palace',
        description: 'Authentic Italian pizza in the heart of the city',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        rating: 4.5,
        reviewsCount: 234,
        priceRange: '$$',
        cuisine: 'Italian',
        location: 'Downtown',
        address: '123 Main St, Downtown',
        phone: '+1234567890',
        website: 'https://pizzapalace.com',
        hours: {
          monday: '11:00 AM - 10:00 PM',
          tuesday: '11:00 AM - 10:00 PM',
          wednesday: '11:00 AM - 10:00 PM',
          thursday: '11:00 AM - 10:00 PM',
          friday: '11:00 AM - 11:00 PM',
          saturday: '11:00 AM - 11:00 PM',
          sunday: '12:00 PM - 9:00 PM',
        },
        features: ['takeout', 'dine-in'],
        tags: ['pizza', 'italian', 'family-friendly'],
        status: 'verified',
      },
      {
        id: '2',
        name: 'Sushi Zen',
        description: 'Fresh sushi and Japanese cuisine',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        rating: 4.8,
        reviewsCount: 189,
        priceRange: '$$$',
        cuisine: 'Japanese',
        location: 'Midtown',
        address: '456 Oak Ave, Midtown',
        phone: '+1234567891',
        website: 'https://sushizen.com',
        hours: {
          monday: 'Closed',
          tuesday: '5:00 PM - 10:00 PM',
          wednesday: '5:00 PM - 10:00 PM',
          thursday: '5:00 PM - 10:00 PM',
          friday: '5:00 PM - 11:00 PM',
          saturday: '5:00 PM - 11:00 PM',
          sunday: '5:00 PM - 9:00 PM',
        },
        features: ['dine-in', 'takeout'],
        tags: ['sushi', 'japanese', 'fresh'],
        status: 'pending',
      },
      {
        id: '3',
        name: 'Burger Junction',
        description: 'Gourmet burgers and craft beer',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        rating: 4.2,
        reviewsCount: 156,
        priceRange: '$$',
        cuisine: 'American',
        location: 'Uptown',
        address: '789 Pine St, Uptown',
        phone: '+1234567892',
        website: 'https://burgerjunction.com',
        hours: {
          monday: '11:00 AM - 9:00 PM',
          tuesday: '11:00 AM - 9:00 PM',
          wednesday: '11:00 AM - 9:00 PM',
          thursday: '11:00 AM - 9:00 PM',
          friday: '11:00 AM - 10:00 PM',
          saturday: '11:00 AM - 10:00 PM',
          sunday: '12:00 PM - 8:00 PM',
        },
        features: ['takeout', 'dine-in'],
        tags: ['burgers', 'american', 'craft-beer'],
        status: 'rejected',
      },
    ];

    let filtered = restaurants;
    
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.cuisine.toLowerCase().includes(searchLower) ||
        r.location.toLowerCase().includes(searchLower)
      );
    }

    if (input.status !== 'all') {
      filtered = filtered.filter(r => r.status === input.status);
    }

    return {
      restaurants: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
      hasMore: input.offset + input.limit < filtered.length,
    };
  });

export const updateRestaurantStatusProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    status: z.enum(['verified', 'pending', 'rejected']),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Updating restaurant ${input.restaurantId} status to ${input.status}`, input.reason);
    return { success: true };
  });

export const deleteRestaurantProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    reason: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Deleting restaurant ${input.restaurantId}:`, input.reason);
    return { success: true };
  });

export const getRestaurantDetailsProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database query
    return {
      id: input.restaurantId,
      name: 'Pizza Palace',
      description: 'Authentic Italian pizza in the heart of the city',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      rating: 4.5,
      reviewsCount: 234,
      priceRange: '$$' as const,
      cuisine: 'Italian',
      location: 'Downtown',
      address: '123 Main St, Downtown',
      phone: '+1234567890',
      website: 'https://pizzapalace.com',
      hours: {
        monday: '11:00 AM - 10:00 PM',
        tuesday: '11:00 AM - 10:00 PM',
        wednesday: '11:00 AM - 10:00 PM',
        thursday: '11:00 AM - 10:00 PM',
        friday: '11:00 AM - 11:00 PM',
        saturday: '11:00 AM - 11:00 PM',
        sunday: '12:00 PM - 9:00 PM',
      },
      features: ['takeout', 'dine-in'],
      tags: ['pizza', 'italian', 'family-friendly'],
      status: 'verified' as const,
      owner: {
        id: 'owner_1',
        name: 'John Doe',
        email: 'john@pizzapalace.com',
        phone: '+1234567890',
      },
      stats: {
        totalOrders: 1250,
        totalRevenue: 45000,
        avgOrderValue: 36,
        popularDishes: ['Margherita Pizza', 'Pepperoni Pizza', 'Caesar Salad'],
      },
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2024-01-20T15:45:00Z',
    };
  });