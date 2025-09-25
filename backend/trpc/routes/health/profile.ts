import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import type { HealthProfile, FoodTrail, TourismSpot } from '@/types/advanced-features';

const mockHealthProfiles: Record<string, HealthProfile> = {};
const mockFoodTrails: FoodTrail[] = [
  {
    id: 'trail_1',
    title: 'Best Suya Spots in Yaounde',
    description: 'Discover the most authentic suya grills across Yaounde',
    city: 'Yaounde',
    stops: [
      { restaurantId: '2', order: 1, recommendedDish: 'Beef Suya', estimatedTime: 30 },
      { restaurantId: '5', order: 2, recommendedDish: 'Chicken Suya', estimatedTime: 25 },
      { restaurantId: '8', order: 3, recommendedDish: 'Mixed Grill', estimatedTime: 35 },
    ],
    difficulty: 'easy',
    duration: 180,
    rating: 4.7,
    completions: 89,
    isActive: true,
  },
  {
    id: 'trail_2',
    title: 'Douala Street Food Adventure',
    description: 'Experience the vibrant street food culture of Douala',
    city: 'Douala',
    stops: [
      { restaurantId: '1', order: 1, recommendedDish: 'Jollof Rice', estimatedTime: 20 },
      { restaurantId: '3', order: 2, recommendedDish: 'Beignets', estimatedTime: 15 },
      { restaurantId: '6', order: 3, recommendedDish: 'Grilled Fish', estimatedTime: 40 },
      { restaurantId: '9', order: 4, recommendedDish: 'Plantain Chips', estimatedTime: 10 },
    ],
    difficulty: 'medium',
    duration: 240,
    rating: 4.5,
    completions: 156,
    isActive: true,
  },
];

const mockTourismSpots: TourismSpot[] = [
  {
    id: 'spot_1',
    name: 'Marché Central Food Court',
    description: 'Traditional market with authentic Cameroonian street food',
    city: 'Yaounde',
    category: 'market',
    location: {
      latitude: 3.8480,
      longitude: 11.5021,
      address: 'Avenue Kennedy, Yaounde',
    },
    highlights: ['Fresh produce', 'Local spices', 'Traditional cooking', 'Cultural experience'],
    bestTimeToVisit: 'Morning (7AM - 11AM)',
    priceRange: '500 - 2000 CFA',
    rating: 4.3,
    photos: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    ],
  },
  {
    id: 'spot_2',
    name: 'Wouri Riverside Grills',
    description: 'Scenic riverside dining with fresh seafood and grilled specialties',
    city: 'Douala',
    category: 'street_food',
    location: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Wouri River Bank, Douala',
    },
    highlights: ['Fresh fish', 'River views', 'Evening atmosphere', 'Local musicians'],
    bestTimeToVisit: 'Evening (5PM - 9PM)',
    priceRange: '2000 - 8000 CFA',
    rating: 4.6,
    photos: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    ],
  },
];

export const getHealthProfileProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[Health] Getting profile for user:', ctx.user.id);

    const profile = mockHealthProfiles[ctx.user.id] || {
      id: `health_${ctx.user.id}`,
      userId: ctx.user.id,
      dailyCalorieGoal: 2000,
      dietaryRestrictions: [],
      allergies: [],
      fitnessGoals: [],
      preferredCuisines: ['West African', 'Mediterranean'],
      healthConditions: [],
    };

    mockHealthProfiles[ctx.user.id] = profile;

    return {
      profile,
      recommendations: getHealthRecommendations(profile),
      weeklyStats: getWeeklyHealthStats(ctx.user.id),
    };
  });

export const updateHealthProfileProcedure = protectedProcedure
  .input(z.object({
    dailyCalorieGoal: z.number().min(1000).max(5000).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    fitnessGoals: z.array(z.string()).optional(),
    preferredCuisines: z.array(z.string()).optional(),
    healthConditions: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Health] Updating profile for user:', ctx.user.id);

    const currentProfile = mockHealthProfiles[ctx.user.id] || {
      id: `health_${ctx.user.id}`,
      userId: ctx.user.id,
      dailyCalorieGoal: 2000,
      dietaryRestrictions: [],
      allergies: [],
      fitnessGoals: [],
      preferredCuisines: [],
      healthConditions: [],
    };

    const updatedProfile: HealthProfile = {
      ...currentProfile,
      ...input,
    };

    mockHealthProfiles[ctx.user.id] = updatedProfile;

    return {
      success: true,
      profile: updatedProfile,
      recommendations: getHealthRecommendations(updatedProfile),
    };
  });

export const getFoodTrailsProcedure = protectedProcedure
  .input(z.object({
    city: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    limit: z.number().min(1).max(20).default(10),
  }))
  .query(async ({ input }) => {
    console.log('[Tourism] Getting food trails');

    let filteredTrails = mockFoodTrails.filter(trail => trail.isActive);

    if (input.city) {
      filteredTrails = filteredTrails.filter(trail => 
        trail.city.toLowerCase() === input.city?.toLowerCase()
      );
    }

    if (input.difficulty) {
      filteredTrails = filteredTrails.filter(trail => trail.difficulty === input.difficulty);
    }

    return {
      trails: filteredTrails
        .sort((a, b) => b.rating - a.rating)
        .slice(0, input.limit)
        .map(trail => ({
          ...trail,
          estimatedCost: calculateTrailCost(trail),
          popularityScore: calculatePopularityScore(trail),
        })),
      totalTrails: filteredTrails.length,
      cities: [...new Set(mockFoodTrails.map(t => t.city))],
    };
  });

export const getTourismSpotsProcedure = protectedProcedure
  .input(z.object({
    city: z.string().optional(),
    category: z.enum(['street_food', 'fine_dining', 'local_specialty', 'market']).optional(),
    limit: z.number().min(1).max(20).default(10),
  }))
  .query(async ({ input }) => {
    console.log('[Tourism] Getting tourism spots');

    let filteredSpots = mockTourismSpots;

    if (input.city) {
      filteredSpots = filteredSpots.filter(spot => 
        spot.city.toLowerCase() === input.city?.toLowerCase()
      );
    }

    if (input.category) {
      filteredSpots = filteredSpots.filter(spot => spot.category === input.category);
    }

    return {
      spots: filteredSpots
        .sort((a, b) => b.rating - a.rating)
        .slice(0, input.limit)
        .map(spot => ({
          ...spot,
          distance: calculateDistance(spot.location),
          isOpen: checkIfOpen(spot),
        })),
      totalSpots: filteredSpots.length,
      categories: ['street_food', 'fine_dining', 'local_specialty', 'market'],
    };
  });

export const startFoodTrailProcedure = protectedProcedure
  .input(z.object({
    trailId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Tourism] Starting trail:', input.trailId, 'for user:', ctx.user.id);

    const trail = mockFoodTrails.find(t => t.id === input.trailId && t.isActive);
    if (!trail) {
      throw new Error('Trail not found or inactive');
    }

    const sessionId = `trail_session_${Date.now()}`;

    return {
      sessionId,
      trail,
      currentStop: 0,
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + trail.duration * 60 * 1000),
      instructions: `Welcome to "${trail.title}"! Start at ${getRestaurantName(trail.stops[0].restaurantId)} and try their ${trail.stops[0].recommendedDish}.`,
      nextStop: trail.stops[0],
    };
  });

function getHealthRecommendations(profile: HealthProfile): string[] {
  const recommendations: string[] = [];

  if (profile.dailyCalorieGoal < 1500) {
    recommendations.push('Consider higher-calorie nutritious options like nuts and avocados');
  }

  if (profile.dietaryRestrictions.includes('vegetarian')) {
    recommendations.push('Try our vegetarian-friendly restaurants with plant-based proteins');
  }

  if (profile.allergies.includes('nuts')) {
    recommendations.push('Always check with restaurants about nut-free preparation');
  }

  if (profile.fitnessGoals.includes('weight_loss')) {
    recommendations.push('Focus on grilled options and vegetable-rich dishes');
  }

  return recommendations;
}

function getWeeklyHealthStats(userId: string): any {
  return {
    averageCalories: 1850,
    mealsLogged: 18,
    healthyChoices: 12,
    calorieGoalMet: 5,
    topCuisines: ['West African', 'Mediterranean', 'Asian'],
  };
}

function calculateTrailCost(trail: FoodTrail): number {
  return trail.stops.length * 4000;
}

function calculatePopularityScore(trail: FoodTrail): number {
  return Math.round((trail.rating * 20) + (trail.completions / 10));
}

function calculateDistance(location: { latitude: number; longitude: number }): string {
  const distances = ['0.5 km', '1.2 km', '2.8 km', '4.1 km', '6.3 km'];
  return distances[Math.floor(Math.random() * distances.length)];
}

function checkIfOpen(spot: TourismSpot): boolean {
  const hour = new Date().getHours();
  if (spot.category === 'market') return hour >= 6 && hour <= 18;
  if (spot.category === 'street_food') return hour >= 17 && hour <= 23;
  return hour >= 10 && hour <= 22;
}

function getRestaurantName(restaurantId: string): string {
  const names: Record<string, string> = {
    '1': 'Mama Njoku Kitchen',
    '2': 'Suya Palace',
    '3': 'Traditional Taste',
    '5': 'Grill Master',
    '6': 'Coastal Flavors',
    '8': 'Night Market',
    '9': 'Plantain Paradise',
  };
  return names[restaurantId] || 'Restaurant';
}