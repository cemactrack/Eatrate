import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { generateText } from '@rork/toolkit-sdk';

// Photo recognition search procedure
export const searchByPhotoProcedure = publicProcedure
  .input(
    z.object({
      imageBase64: z.string(),
      location: z.enum(['all', 'douala', 'yaounde', 'buea', 'limbe']).optional().default('all'),
      limit: z.number().min(1).max(20).default(10),
    })
  )
  .query(async ({ input }) => {
    console.log('[tRPC] Searching restaurants by photo');
    
    try {
      // Enhanced mock data with dishes
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
          dishes: ['Coq au Vin', 'Bouillabaisse', 'Ratatouille', 'Crème Brûlée', 'Escargot'],
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
          dishes: ['Ndole', 'Eru', 'Jollof Rice', 'Plantain', 'Pepper Soup'],
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
          dishes: ['Margherita Pizza', 'Carbonara', 'Lasagna', 'Tiramisu', 'Bruschetta'],
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
          dishes: ['Sushi', 'Sashimi', 'Ramen', 'Tempura', 'Miso Soup'],
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
          dishes: ['Cheeseburger', 'French Fries', 'Chicken Wings', 'Milkshake', 'Onion Rings'],
        },
      ];
      
      // Use AI to analyze the food image
      const analysisResult = await generateText({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and identify the dish, cuisine type, and key ingredients. Return your analysis in this format: "Dish: [dish name], Cuisine: [cuisine type], Ingredients: [key ingredients separated by commas]"'
              },
              {
                type: 'image',
                image: input.imageBase64
              }
            ]
          }
        ]
      });
      
      console.log('[tRPC] AI Analysis Result:', analysisResult);
      
      // Parse the AI response to extract dish info
      const dishMatch = analysisResult.match(/Dish:\s*([^,]+)/i);
      const cuisineMatch = analysisResult.match(/Cuisine:\s*([^,]+)/i);
      const ingredientsMatch = analysisResult.match(/Ingredients:\s*(.+)/i);
      
      const identifiedDish = dishMatch?.[1]?.trim() || '';
      const identifiedCuisine = cuisineMatch?.[1]?.trim() || '';
      const identifiedIngredients = ingredientsMatch?.[1]?.split(',').map(i => i.trim()) || [];
      
      console.log('[tRPC] Parsed results:', { identifiedDish, identifiedCuisine, identifiedIngredients });
      
      // Filter by location first
      let filteredRestaurants = [...mockRestaurants];
      if (input.location !== 'all') {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.address.toLowerCase().includes(input.location!)
        );
      }
      
      // Score restaurants based on how well they match the identified food
      const scoredResults = filteredRestaurants.map(restaurant => {
        let score = 0;
        
        // Check if restaurant serves the identified dish
        if (identifiedDish && restaurant.dishes.some(dish => 
          dish.toLowerCase().includes(identifiedDish.toLowerCase()) ||
          identifiedDish.toLowerCase().includes(dish.toLowerCase())
        )) {
          score += 10;
        }
        
        // Check cuisine match
        if (identifiedCuisine && restaurant.cuisine.toLowerCase().includes(identifiedCuisine.toLowerCase())) {
          score += 8;
        }
        
        // Check ingredient/tag matches
        identifiedIngredients.forEach(ingredient => {
          if (restaurant.tags.some(tag => tag.toLowerCase().includes(ingredient.toLowerCase()))) {
            score += 2;
          }
          if (restaurant.dishes.some(dish => dish.toLowerCase().includes(ingredient.toLowerCase()))) {
            score += 3;
          }
        });
        
        // Boost score for higher rated restaurants
        score += restaurant.rating;
        
        return { ...restaurant, matchScore: score };
      });
      
      // Filter out restaurants with very low scores and sort by score
      const finalResults = scoredResults
        .filter(r => r.matchScore > 2)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.limit);
      
      return {
        analysis: {
          dish: identifiedDish,
          cuisine: identifiedCuisine,
          ingredients: identifiedIngredients,
          confidence: finalResults.length > 0 ? 'high' : 'low',
        },
        restaurants: finalResults,
        total: finalResults.length,
      };
      
    } catch (error: any) {
      console.error('[tRPC] Photo search failed:', error);
      
      // Fallback: return popular restaurants
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
          dishes: ['Coq au Vin', 'Bouillabaisse', 'Ratatouille'],
          matchScore: 0,
        },
      ];
      
      return {
        analysis: {
          dish: 'Unable to identify',
          cuisine: 'Unknown',
          ingredients: [],
          confidence: 'low' as const,
        },
        restaurants: mockRestaurants.slice(0, input.limit),
        total: mockRestaurants.length,
        error: 'Could not analyze image, showing popular restaurants instead',
      };
    }
  });