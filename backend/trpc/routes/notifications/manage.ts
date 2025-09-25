import { z } from 'zod';
import { protectedProcedure } from '../../create-context';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'like' as const,
    title: 'New Like',
    message: 'John liked your food photo',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop',
    data: { postId: '123', userId: 'john123' },
    userId: 'current-user',
    isRead: false,
    createdAt: new Date(),
    actionUrl: '/posts/123',
    priority: 'normal' as const,
    category: 'social',
  },
  {
    id: '2',
    type: 'achievement' as const,
    title: 'Achievement Unlocked!',
    message: 'You earned the "First Review" badge',
    imageUrl: undefined,
    data: { achievementId: 'first-review' },
    userId: 'current-user',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    actionUrl: '/achievements',
    priority: 'high' as const,
    category: 'achievements',
  },
  {
    id: '3',
    type: 'event' as const,
    title: 'Food Festival This Weekend',
    message: 'Don\'t miss the Douala Food Festival starting tomorrow',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop',
    data: { eventId: 'douala-food-fest-2024' },
    userId: 'current-user',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionUrl: '/events',
    priority: 'normal' as const,
    category: 'events',
  },
];

const mockSettings = {
  pushEnabled: true,
  emailEnabled: false,
  categories: {
    social: true,
    achievements: true,
    events: true,
    challenges: true,
    restaurants: true,
    system: false,
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
  frequency: {
    instant: true,
    daily: false,
    weekly: true,
  },
};

export const getAllProcedure = protectedProcedure.query(async ({ ctx }) => {
  // In a real app, fetch from database
  return mockNotifications;
});

export const getSettingsProcedure = protectedProcedure.query(async ({ ctx }) => {
  // In a real app, fetch from database
  return mockSettings;
});

export const markAsReadProcedure = protectedProcedure
  .input(z.object({ notificationId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, update notification in database
    return { success: true };
  });

export const markAllAsReadProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  // In a real app, mark all user notifications as read
  return { success: true };
});

export const deleteProcedure = protectedProcedure
  .input(z.object({ notificationId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, delete notification from database
    return { success: true };
  });

export const updateSettingsProcedure = protectedProcedure
  .input(z.object({
    pushEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    categories: z.object({
      social: z.boolean().optional(),
      achievements: z.boolean().optional(),
      events: z.boolean().optional(),
      challenges: z.boolean().optional(),
      restaurants: z.boolean().optional(),
      system: z.boolean().optional(),
    }).optional(),
    quietHours: z.object({
      enabled: z.boolean().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    }).optional(),
    frequency: z.object({
      instant: z.boolean().optional(),
      daily: z.boolean().optional(),
      weekly: z.boolean().optional(),
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, update settings in database
    return { ...mockSettings, ...input };
  });

export const registerPushTokenProcedure = protectedProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, save push token to database
    console.log(`Registered push token for user ${ctx.user.id}: ${input.token}`);
    return { success: true };
  });