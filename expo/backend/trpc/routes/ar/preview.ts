import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import type { ARPreview } from '@/types/advanced-features';

const mockARPreviews: ARPreview[] = [
  {
    id: 'ar_1',
    dishId: 'dish_jollof_1',
    modelUrl: 'https://models.readyplayer.me/food/jollof-rice.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
    isActive: true,
    viewCount: 1250,
  },
  {
    id: 'ar_2',
    dishId: 'dish_suya_1',
    modelUrl: 'https://models.readyplayer.me/food/suya-sticks.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    isActive: true,
    viewCount: 890,
  },
  {
    id: 'ar_3',
    dishId: 'dish_ndole_1',
    modelUrl: 'https://models.readyplayer.me/food/ndole-soup.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
    isActive: true,
    viewCount: 650,
  },
];

export const getARPreviewProcedure = protectedProcedure
  .input(z.object({
    dishId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('[AR Preview] Getting preview for dish:', input.dishId);

    const preview = mockARPreviews.find(p => p.dishId === input.dishId && p.isActive);
    
    if (!preview) {
      return null;
    }

    return {
      ...preview,
      viewCount: preview.viewCount + 1,
      instructions: {
        ios: 'Tap to place the dish on your table using ARKit',
        android: 'Tap to place the dish on your table using ARCore',
        web: 'AR preview not available on web - showing 3D model instead',
      },
      features: [
        'Realistic 3D model',
        'Accurate portion size',
        'Interactive rotation',
        'Lighting effects',
      ],
    };
  });

export const recordARViewProcedure = protectedProcedure
  .input(z.object({
    dishId: z.string(),
    sessionDuration: z.number().min(0),
    interactionType: z.enum(['view', 'place', 'rotate', 'scale']),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[AR Preview] Recording view for dish:', input.dishId, 'by user:', ctx.user.id);

    const preview = mockARPreviews.find(p => p.dishId === input.dishId);
    if (preview) {
      preview.viewCount += 1;
    }

    return {
      success: true,
      newViewCount: preview?.viewCount || 0,
      sessionId: `ar_session_${Date.now()}`,
      analytics: {
        totalViews: preview?.viewCount || 0,
        averageSessionTime: 45,
        popularInteractions: ['rotate', 'place', 'view'],
      },
    };
  });

export const getPopularARDishes = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(20).default(10),
    city: z.string().optional(),
  }))
  .query(async ({ input }) => {
    console.log('[AR Preview] Getting popular AR dishes, limit:', input.limit);

    const sortedPreviews = mockARPreviews
      .filter(p => p.isActive)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, input.limit);

    return {
      dishes: sortedPreviews.map(preview => ({
        ...preview,
        dishName: getDishName(preview.dishId),
        restaurantName: getRestaurantName(preview.dishId),
        category: getDishCategory(preview.dishId),
      })),
      totalARDishes: mockARPreviews.filter(p => p.isActive).length,
    };
  });

function getDishName(dishId: string): string {
  const dishMap: Record<string, string> = {
    'dish_jollof_1': 'Jollof Rice',
    'dish_suya_1': 'Suya Sticks',
    'dish_ndole_1': 'Ndole Soup',
  };
  return dishMap[dishId] || 'Unknown Dish';
}

function getRestaurantName(dishId: string): string {
  const restaurantMap: Record<string, string> = {
    'dish_jollof_1': 'Mama Njoku Kitchen',
    'dish_suya_1': 'Suya Palace',
    'dish_ndole_1': 'Traditional Taste',
  };
  return restaurantMap[dishId] || 'Unknown Restaurant';
}

function getDishCategory(dishId: string): string {
  const categoryMap: Record<string, string> = {
    'dish_jollof_1': 'Main Course',
    'dish_suya_1': 'Grilled Meat',
    'dish_ndole_1': 'Traditional Soup',
  };
  return categoryMap[dishId] || 'Other';
}