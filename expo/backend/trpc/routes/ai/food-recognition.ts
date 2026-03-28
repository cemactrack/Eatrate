import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { generateObject } from '@rork/toolkit-sdk';
import type { FoodRecognition } from '@/types/advanced-features';

const mockFoodDatabase = [
  { name: 'Jollof Rice', cuisine: 'West African', category: 'Main Course', calories: 350, protein: 8, carbs: 65, fat: 8 },
  { name: 'Ndole', cuisine: 'Cameroonian', category: 'Main Course', calories: 420, protein: 25, carbs: 15, fat: 28 },
  { name: 'Suya', cuisine: 'Nigerian', category: 'Grilled Meat', calories: 280, protein: 35, carbs: 5, fat: 12 },
  { name: 'Plantain', cuisine: 'African', category: 'Side Dish', calories: 180, protein: 2, carbs: 47, fat: 0.5 },
  { name: 'Fufu', cuisine: 'Central African', category: 'Staple', calories: 267, protein: 1, carbs: 67, fat: 0.2 },
  { name: 'Pepper Soup', cuisine: 'West African', category: 'Soup', calories: 150, protein: 20, carbs: 8, fat: 5 },
  { name: 'Banga Soup', cuisine: 'Nigerian', category: 'Soup', calories: 320, protein: 18, carbs: 12, fat: 22 },
  { name: 'Egusi', cuisine: 'West African', category: 'Soup', calories: 380, protein: 22, carbs: 10, fat: 28 },
];

const mockRestaurants = [
  { id: '1', name: 'Mama Njoku Kitchen', city: 'Douala', specialties: ['Jollof Rice', 'Ndole', 'Plantain'] },
  { id: '2', name: 'Suya Palace', city: 'Yaounde', specialties: ['Suya', 'Pepper Soup'] },
  { id: '3', name: 'Traditional Taste', city: 'Buea', specialties: ['Fufu', 'Ndole', 'Egusi'] },
  { id: '4', name: 'Lagos Buka', city: 'Limbe', specialties: ['Jollof Rice', 'Banga Soup', 'Plantain'] },
];

export const recognizeFoodProcedure = protectedProcedure
  .input(z.object({
    imageBase64: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string().optional(),
    }).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      console.log('[AI Food Recognition] Processing image for user:', ctx.user.id);

      const recognitionResult = await generateObject({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image and identify the dish. Focus on African cuisine, especially Cameroonian, Nigerian, and West African dishes. Provide the dish name, confidence level (0-1), cuisine type, and category.' },
              { type: 'image', image: input.imageBase64 }
            ]
          }
        ],
        schema: z.object({
          name: z.string().describe('Name of the identified dish'),
          confidence: z.number().min(0).max(1).describe('Confidence level of identification'),
          cuisine: z.string().optional().describe('Type of cuisine (e.g., West African, Cameroonian)'),
          category: z.string().optional().describe('Food category (e.g., Main Course, Soup, Side Dish)'),
          description: z.string().optional().describe('Brief description of the dish'),
        })
      });

      const foodData = mockFoodDatabase.find(food => 
        food.name.toLowerCase().includes(recognitionResult.name.toLowerCase()) ||
        recognitionResult.name.toLowerCase().includes(food.name.toLowerCase())
      ) || mockFoodDatabase[0];

      const nearbyRestaurants = mockRestaurants
        .filter(restaurant => 
          restaurant.specialties.some(specialty => 
            specialty.toLowerCase().includes(recognitionResult.name.toLowerCase()) ||
            recognitionResult.name.toLowerCase().includes(specialty.toLowerCase())
          )
        )
        .slice(0, 5)
        .map(r => r.id);

      const result: FoodRecognition = {
        id: `recognition_${Date.now()}`,
        userId: ctx.user.id,
        imageUrl: `data:image/jpeg;base64,${input.imageBase64.substring(0, 100)}...`,
        recognizedFood: {
          name: recognitionResult.name,
          confidence: recognitionResult.confidence,
          cuisine: recognitionResult.cuisine,
          category: recognitionResult.category,
        },
        nutrition: {
          calories: foodData.calories,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat,
          fiber: Math.round(foodData.carbs * 0.1),
        },
        nearbyRestaurants,
        createdAt: new Date(),
      };

      console.log('[AI Food Recognition] Success:', result.recognizedFood.name);
      return result;

    } catch (error) {
      console.error('[AI Food Recognition] Error:', error);
      throw new Error('Failed to recognize food from image');
    }
  });

export const getFoodHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    console.log('[AI Food Recognition] Getting history for user:', ctx.user.id);
    
    const mockHistory: FoodRecognition[] = [
      {
        id: 'history_1',
        userId: ctx.user.id,
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
        recognizedFood: {
          name: 'Jollof Rice',
          confidence: 0.95,
          cuisine: 'West African',
          category: 'Main Course',
        },
        nutrition: { calories: 350, protein: 8, carbs: 65, fat: 8, fiber: 6 },
        nearbyRestaurants: ['1', '4'],
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'history_2',
        userId: ctx.user.id,
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
        recognizedFood: {
          name: 'Suya',
          confidence: 0.88,
          cuisine: 'Nigerian',
          category: 'Grilled Meat',
        },
        nutrition: { calories: 280, protein: 35, carbs: 5, fat: 12, fiber: 1 },
        nearbyRestaurants: ['2'],
        createdAt: new Date(Date.now() - 172800000),
      },
    ];

    return {
      history: mockHistory.slice(input.offset, input.offset + input.limit),
      total: mockHistory.length,
      hasMore: input.offset + input.limit < mockHistory.length,
    };
  });