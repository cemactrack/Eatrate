import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { TrendingDish, NearbyRecommendation, SearchHistory, PersonalizedRecommendation } from '@/types/restaurant';

// Mock data for trending dishes
const mockTrendingDishes: TrendingDish[] = [
  {
    dish: {
      id: '1',
      name: 'Ndolé with Plantains',
      restaurant: 'Chez Wou',
      rating: 4.8,
      reviewCount: 156,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
      price: 2500,
      description: 'Traditional Cameroonian dish with groundnuts and bitter leaves',
      category: 'Traditional',
      tags: ['spicy', 'traditional', 'popular'],
      allergens: ['peanuts'],
      dietaryTags: ['gluten-free'],
      nutritionInfo: {
        calories: 450,
        protein: 25,
        carbs: 35,
        fat: 20
      },
      trendingScore: 95
    },
    restaurant: {
      id: 'rest1',
      name: 'Chez Wou',
      cuisine: 'Cameroonian',
      rating: 4.6,
      reviewCount: 234,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      address: 'Akwa, Douala',
      priceRange: '$$',
      isOpen: true,
      tags: ['traditional', 'local', 'authentic'],
      verified: true,
      claimed: true,
      coordinates: {
        latitude: 4.0511,
        longitude: 9.7679
      }
    },
    trendScore: 95,
    weeklyOrders: 89,
    weeklyReviews: 23,
    averageRating: 4.8,
    city: 'Douala'
  },
  {
    dish: {
      id: '2',
      name: 'Grilled Fish with Attiéké',
      restaurant: 'Ocean Breeze',
      rating: 4.7,
      reviewCount: 98,
      image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44',
      price: 3200,
      description: 'Fresh grilled fish served with traditional cassava couscous',
      category: 'Seafood',
      tags: ['grilled', 'fresh', 'coastal'],
      allergens: ['fish'],
      dietaryTags: ['gluten-free', 'high-protein'],
      nutritionInfo: {
        calories: 380,
        protein: 35,
        carbs: 25,
        fat: 15
      },
      trendingScore: 88
    },
    restaurant: {
      id: 'rest2',
      name: 'Ocean Breeze',
      cuisine: 'Seafood',
      rating: 4.5,
      reviewCount: 187,
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de',
      address: 'Limbe Beach',
      priceRange: '$$$',
      isOpen: true,
      tags: ['seafood', 'beachfront', 'fresh'],
      verified: true,
      claimed: true,
      coordinates: {
        latitude: 4.0186,
        longitude: 9.2043
      }
    },
    trendScore: 88,
    weeklyOrders: 67,
    weeklyReviews: 18,
    averageRating: 4.7,
    city: 'Limbe'
  }
];

const mockNearbyRecommendations: NearbyRecommendation[] = [
  {
    restaurant: {
      id: 'rest3',
      name: 'Le Petit Paris',
      cuisine: 'French',
      rating: 4.4,
      reviewCount: 145,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      address: 'Bastos, Yaounde',
      priceRange: '$$$',
      isOpen: true,
      tags: ['romantic', 'fine-dining', 'french'],
      verified: true,
      claimed: true,
      coordinates: {
        latitude: 3.8480,
        longitude: 11.5021
      }
    },
    distance: 0.8,
    matchScore: 92,
    reasons: ['Matches your cuisine preferences', 'Highly rated by similar users', 'Popular for dinner'],
    estimatedWalkTime: 10,
    isOpen: true
  }
];

const mockSearchHistory: SearchHistory[] = [
  {
    id: '1',
    userId: 'user1',
    query: 'vegan restaurants',
    type: 'restaurant',
    filters: { cuisine: 'vegan', city: 'douala' },
    resultCount: 12,
    createdAt: '2024-03-15T14:30:00Z'
  },
  {
    id: '2',
    userId: 'user1',
    query: 'ndole',
    type: 'dish',
    filters: {},
    resultCount: 8,
    createdAt: '2024-03-14T19:45:00Z'
  }
];

const mockPersonalizedRecommendations: PersonalizedRecommendation[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'restaurant',
    itemId: 'rest3',
    item: {
      id: 'rest3',
      name: 'Le Petit Paris',
      cuisine: 'French',
      rating: 4.4,
      reviewCount: 145,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      address: 'Bastos, Yaounde',
      priceRange: '$$$',
      isOpen: true,
      tags: ['romantic', 'fine-dining', 'french'],
      verified: true,
      claimed: true
    },
    score: 0.92,
    reasons: ['Similar to restaurants you\'ve liked', 'Popular in your area', 'Matches your price range'],
    isViewed: false,
    isDismissed: false,
    createdAt: '2024-03-15T08:00:00Z'
  }
];

// Get trending dishes
export const getTrendingDishesProcedure = publicProcedure
  .input(z.object({
    city: z.string().optional(),
    cuisine: z.string().optional(),
    period: z.enum(['day', 'week', 'month']).default('week'),
    limit: z.number().default(10)
  }))
  .query(async ({ input }) => {
    console.log('[getTrendingDishes] Fetching trending dishes:', input);
    
    let filtered = [...mockTrendingDishes];
    
    if (input.city) {
      filtered = filtered.filter(item => 
        item.city.toLowerCase() === input.city!.toLowerCase()
      );
    }
    
    if (input.cuisine) {
      filtered = filtered.filter(item => 
        item.restaurant.cuisine.toLowerCase().includes(input.cuisine!.toLowerCase())
      );
    }
    
    // Sort by trend score
    filtered.sort((a, b) => b.trendScore - a.trendScore);
    
    return {
      dishes: filtered.slice(0, input.limit),
      period: input.period,
      lastUpdated: new Date().toISOString()
    };
  });

// Get nearby recommendations
export const getNearbyRecommendationsProcedure = protectedProcedure
  .input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().default(5), // km
    limit: z.number().default(10)
  }))
  .query(async ({ input, ctx }) => {
    console.log('[getNearbyRecommendations] Fetching nearby recommendations for user:', ctx.user?.id);
    
    // Mock implementation - in real app, use geospatial queries
    const recommendations = mockNearbyRecommendations.filter(rec => 
      rec.distance <= input.radius
    );
    
    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    
    return {
      recommendations: recommendations.slice(0, input.limit),
      userLocation: {
        latitude: input.latitude,
        longitude: input.longitude
      },
      radius: input.radius
    };
  });

// Get personalized recommendations
export const getPersonalizedRecommendationsProcedure = protectedProcedure
  .input(z.object({
    type: z.enum(['restaurant', 'dish', 'event', 'group']).optional(),
    limit: z.number().default(20)
  }))
  .query(async ({ input, ctx }) => {
    console.log('[getPersonalizedRecommendations] Fetching recommendations for user:', ctx.user?.id);
    
    let filtered = mockPersonalizedRecommendations.filter(rec => 
      rec.userId === ctx.user?.id && !rec.isDismissed
    );
    
    if (input.type) {
      filtered = filtered.filter(rec => rec.type === input.type);
    }
    
    // Sort by score
    filtered.sort((a, b) => b.score - a.score);
    
    return {
      recommendations: filtered.slice(0, input.limit),
      total: filtered.length
    };
  });

// Dismiss recommendation
export const dismissRecommendationProcedure = protectedProcedure
  .input(z.object({
    recommendationId: z.string()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[dismissRecommendation] Dismissing recommendation:', input.recommendationId);
    
    const recIndex = mockPersonalizedRecommendations.findIndex(rec => 
      rec.id === input.recommendationId && rec.userId === ctx.user?.id
    );
    
    if (recIndex !== -1) {
      mockPersonalizedRecommendations[recIndex].isDismissed = true;
    }
    
    return {
      success: true,
      message: 'Recommendation dismissed'
    };
  });

// Get search history
export const getSearchHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().default(20)
  }))
  .query(async ({ input, ctx }) => {
    console.log('[getSearchHistory] Fetching search history for user:', ctx.user?.id);
    
    const userHistory = mockSearchHistory
      .filter(item => item.userId === ctx.user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, input.limit);
    
    return {
      history: userHistory,
      total: userHistory.length
    };
  });

// Save search query
export const saveSearchQueryProcedure = protectedProcedure
  .input(z.object({
    query: z.string(),
    type: z.enum(['restaurant', 'dish', 'cuisine', 'location']),
    filters: z.any().optional(),
    resultCount: z.number()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[saveSearchQuery] Saving search query:', input.query);
    
    const newSearchItem: SearchHistory = {
      id: Date.now().toString(),
      userId: ctx.user?.id || '',
      query: input.query,
      type: input.type,
      filters: input.filters || {},
      resultCount: input.resultCount,
      createdAt: new Date().toISOString()
    };
    
    mockSearchHistory.push(newSearchItem);
    
    // Keep only last 50 searches per user
    const userSearches = mockSearchHistory.filter(item => item.userId === ctx.user?.id);
    if (userSearches.length > 50) {
      const toRemove = userSearches.slice(50);
      toRemove.forEach(item => {
        const index = mockSearchHistory.findIndex(s => s.id === item.id);
        if (index !== -1) {
          mockSearchHistory.splice(index, 1);
        }
      });
    }
    
    return {
      success: true,
      searchItem: newSearchItem
    };
  });

// Clear search history
export const clearSearchHistoryProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    console.log('[clearSearchHistory] Clearing search history for user:', ctx.user?.id);
    
    // Remove all search history for the user
    for (let i = mockSearchHistory.length - 1; i >= 0; i--) {
      if (mockSearchHistory[i].userId === ctx.user?.id) {
        mockSearchHistory.splice(i, 1);
      }
    }
    
    return {
      success: true,
      message: 'Search history cleared'
    };
  });

// Get smart suggestions
export const getSmartSuggestionsProcedure = protectedProcedure
  .input(z.object({
    query: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional()
  }))
  .query(async ({ input, ctx }) => {
    console.log('[getSmartSuggestions] Generating smart suggestions for user:', ctx.user?.id);
    
    // Mock implementation - in real app, use ML/AI for suggestions
    const suggestions = {
      restaurants: [
        'Popular restaurants near you',
        'Highly rated new openings',
        'Restaurants similar to your favorites'
      ],
      dishes: [
        'Trending dishes this week',
        'Dishes you might like',
        'Local specialties'
      ],
      cuisines: [
        'African cuisine',
        'French cuisine',
        'Seafood',
        'Vegan options'
      ],
      locations: [
        'Douala restaurants',
        'Yaounde fine dining',
        'Buea street food'
      ]
    };
    
    if (input.query) {
      // Filter suggestions based on query
      const queryLower = input.query.toLowerCase();
      Object.keys(suggestions).forEach(key => {
        suggestions[key as keyof typeof suggestions] = suggestions[key as keyof typeof suggestions].filter(
          suggestion => suggestion.toLowerCase().includes(queryLower)
        );
      });
    }
    
    return suggestions;
  });

// Get dish of the day
export const getDishOfTheDayProcedure = publicProcedure
  .input(z.object({
    city: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log('[getDishOfTheDay] Fetching dish of the day for city:', input.city);
    
    // Mock implementation - rotate featured dish daily
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const dishIndex = dayOfYear % mockTrendingDishes.length;
    
    let featuredDish = mockTrendingDishes[dishIndex];
    
    if (input.city) {
      const cityDishes = mockTrendingDishes.filter(d => 
        d.city.toLowerCase() === input.city!.toLowerCase()
      );
      if (cityDishes.length > 0) {
        featuredDish = cityDishes[dayOfYear % cityDishes.length];
      }
    }
    
    return {
      dish: featuredDish,
      date: new Date().toISOString().split('T')[0],
      city: input.city || 'All Cities'
    };
  });