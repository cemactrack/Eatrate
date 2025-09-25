import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';

// Menu management types
interface MenuDish {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  spicyLevel?: number;
  preparationTime?: number;
  available: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

interface MenuCategoryWithOrder {
  id: string;
  name: string;
  description?: string;
  order: number;
  dishes: MenuDish[];
  restaurantId: string;
}

interface RestaurantMenuData {
  id: string;
  restaurantId: string;
  categories: MenuCategoryWithOrder[];
  lastUpdated: string;
}

const mockMenus: RestaurantMenuData[] = [
  {
    id: '1',
    restaurantId: 'rest1',
    categories: [
      {
        id: 'cat1',
        name: 'Appetizers',
        description: 'Start your meal with our delicious appetizers',
        order: 1,
        dishes: [
          {
            id: 'dish1',
            name: 'Ndolé Spring Rolls',
            description: 'Traditional Cameroonian ndolé wrapped in crispy spring roll pastry',
            price: 2500,
            currency: 'XAF',
            category: 'Appetizers',
            images: ['https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400'],
            rating: 4.5,
            reviewCount: 23,
            ingredients: ['Ndolé leaves', 'Groundnuts', 'Spring roll pastry', 'Spices'],
            allergens: ['Nuts'],
            dietary: ['Vegetarian'],
            spicyLevel: 2,
            preparationTime: 15,
            available: true,
            restaurantId: 'rest1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        restaurantId: 'rest1'
      }
    ],
    lastUpdated: '2024-01-15T10:00:00Z'
  }
];

export const getRestaurantMenuProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('📋 Fetching restaurant menu:', input.restaurantId);
    
    const menu = mockMenus.find(m => m.restaurantId === input.restaurantId);
    
    if (!menu) {
      return {
        id: `menu_${input.restaurantId}`,
        restaurantId: input.restaurantId,
        categories: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    return menu;
  });

export const createMenuCategoryProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    order: z.number().min(0).optional()
  }))
  .mutation(async ({ input }) => {
    console.log('➕ Creating menu category:', input);
    
    let menu = mockMenus.find(m => m.restaurantId === input.restaurantId);
    
    if (!menu) {
      menu = {
        id: `menu_${input.restaurantId}`,
        restaurantId: input.restaurantId,
        categories: [],
        lastUpdated: new Date().toISOString()
      };
      mockMenus.push(menu);
    }
    
    const newCategory: MenuCategoryWithOrder = {
      id: `cat_${Date.now()}`,
      name: input.name,
      description: input.description,
      order: input.order ?? menu.categories.length,
      dishes: [],
      restaurantId: input.restaurantId
    };
    
    menu.categories.push(newCategory);
    menu.categories.sort((a, b) => a.order - b.order);
    menu.lastUpdated = new Date().toISOString();
    
    return {
      category: newCategory,
      message: 'Menu category created successfully'
    };
  });

export const addDishToMenuProcedure = protectedProcedure
  .input(z.object({
    categoryId: z.string(),
    name: z.string().min(1).max(200),
    description: z.string().max(1000),
    price: z.number().min(0),
    currency: z.string().default('XAF'),
    images: z.array(z.string().url()).optional().default([]),
    ingredients: z.array(z.string()).optional().default([]),
    allergens: z.array(z.string()).optional().default([]),
    dietary: z.array(z.string()).optional().default([]),
    spicyLevel: z.number().min(0).max(5).optional(),
    preparationTime: z.number().min(1).max(180).optional(),
    available: z.boolean().optional().default(true)
  }))
  .mutation(async ({ input }) => {
    console.log('🍽️ Adding dish to menu:', input);
    
    for (const menu of mockMenus) {
      const category = menu.categories.find(c => c.id === input.categoryId);
      if (category) {
        const newDish: MenuDish = {
          id: `dish_${Date.now()}`,
          name: input.name,
          description: input.description,
          price: input.price,
          currency: input.currency,
          category: category.name,
          images: input.images,
          rating: 0,
          reviewCount: 0,
          ingredients: input.ingredients,
          allergens: input.allergens,
          dietary: input.dietary,
          spicyLevel: input.spicyLevel,
          preparationTime: input.preparationTime,
          available: input.available,
          restaurantId: menu.restaurantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        category.dishes.push(newDish);
        menu.lastUpdated = new Date().toISOString();
        
        return {
          dish: newDish,
          message: 'Dish added to menu successfully'
        };
      }
    }
    
    throw new Error('Category not found');
  });