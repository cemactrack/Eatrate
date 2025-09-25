import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { generateText } from '@rork/toolkit-sdk';
import type { VoiceCommand } from '@/types/advanced-features';

const mockVoiceHistory: Record<string, VoiceCommand[]> = {};

export const processVoiceCommandProcedure = protectedProcedure
  .input(z.object({
    command: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string().optional(),
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Voice Assistant] Processing command for user:', ctx.user.id);

    try {
      const intentAnalysis = await generateText({
        messages: [
          {
            role: 'user',
            content: `Analyze this voice command and determine the intent and extract parameters: "${input.command}". 
            
            Possible intents: search, recommend, navigate, order
            
            For search: extract cuisine type, price range, location
            For recommend: extract preferences, dietary restrictions
            For navigate: extract destination restaurant
            For order: extract restaurant name, dish preferences
            
            Respond in JSON format with: {"intent": "search|recommend|navigate|order", "parameters": {...}, "confidence": 0.0-1.0}`
          }
        ]
      });

      let parsedIntent;
      try {
        parsedIntent = JSON.parse(intentAnalysis);
      } catch {
        parsedIntent = {
          intent: 'search',
          parameters: { query: input.command },
          confidence: 0.5
        };
      }

      const response = await generateResponse(parsedIntent, input.location);

      const voiceCommand: VoiceCommand = {
        id: `voice_${Date.now()}`,
        userId: ctx.user.id,
        command: input.command,
        intent: parsedIntent.intent,
        parameters: parsedIntent.parameters,
        response,
        createdAt: new Date(),
      };

      if (!mockVoiceHistory[ctx.user.id]) {
        mockVoiceHistory[ctx.user.id] = [];
      }
      mockVoiceHistory[ctx.user.id].push(voiceCommand);

      return {
        response,
        intent: parsedIntent.intent,
        confidence: parsedIntent.confidence,
        suggestions: getSuggestions(parsedIntent.intent),
        actions: getActionButtons(parsedIntent.intent, parsedIntent.parameters),
      };

    } catch (error) {
      console.error('[Voice Assistant] Error:', error);
      return {
        response: "I'm sorry, I couldn't understand that. Try asking about restaurants, food recommendations, or directions.",
        intent: 'unknown',
        confidence: 0,
        suggestions: [
          "Find pizza near me",
          "Recommend good restaurants in Douala",
          "Show me vegetarian options",
        ],
        actions: [],
      };
    }
  });

export const getVoiceHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(50).default(20),
  }))
  .query(async ({ input, ctx }) => {
    console.log('[Voice Assistant] Getting history for user:', ctx.user.id);

    const history = mockVoiceHistory[ctx.user.id] || [];
    
    return {
      commands: history
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit),
      totalCommands: history.length,
      popularIntents: getPopularIntents(history),
    };
  });

export const getVoiceSuggestionsProcedure = protectedProcedure
  .input(z.object({
    context: z.enum(['home', 'search', 'restaurant', 'profile']).optional(),
  }))
  .query(async ({ input }) => {
    console.log('[Voice Assistant] Getting suggestions for context:', input.context);

    const suggestions = {
      home: [
        "Find restaurants near me",
        "What's trending in Douala?",
        "Show me healthy options",
        "Recommend something new",
      ],
      search: [
        "Filter by price under 5000 CFA",
        "Show only vegetarian restaurants",
        "Find places open now",
        "Sort by rating",
      ],
      restaurant: [
        "What are the popular dishes here?",
        "Show me the menu",
        "Get directions to this place",
        "Check delivery options",
      ],
      profile: [
        "Show my favorite restaurants",
        "Check my loyalty points",
        "View my recent reviews",
        "Update my preferences",
      ],
    };

    return {
      suggestions: suggestions[input.context || 'home'],
      quickCommands: [
        { text: "Find pizza", icon: "🍕" },
        { text: "Nearby restaurants", icon: "📍" },
        { text: "Healthy food", icon: "🥗" },
        { text: "Delivery options", icon: "🚚" },
      ],
    };
  });

async function generateResponse(intent: any, location?: any): Promise<string> {
  const { intent: intentType, parameters } = intent;

  switch (intentType) {
    case 'search':
      return await handleSearchIntent(parameters, location);
    case 'recommend':
      return await handleRecommendIntent(parameters, location);
    case 'navigate':
      return await handleNavigateIntent(parameters);
    case 'order':
      return await handleOrderIntent(parameters);
    default:
      return "I can help you find restaurants, get recommendations, navigate to places, or place orders. What would you like to do?";
  }
}

async function handleSearchIntent(parameters: any, location?: any): Promise<string> {
  const cuisine = parameters.cuisine || 'any cuisine';
  const priceRange = parameters.priceRange || 'any price range';
  const locationText = location?.city || 'your area';

  return `I found several ${cuisine} restaurants in ${locationText} with ${priceRange}. Here are the top recommendations: Mama Njoku Kitchen (4.8★), Suya Palace (4.6★), and Traditional Taste (4.7★). Would you like more details about any of these?`;
}

async function handleRecommendIntent(parameters: any, location?: any): Promise<string> {
  const preferences = parameters.preferences || 'your taste preferences';
  const dietary = parameters.dietary || '';
  const locationText = location?.city || 'your area';

  const dietaryText = dietary ? ` with ${dietary} options` : '';
  
  return `Based on ${preferences}${dietaryText}, I recommend trying Jollof Rice at Mama Njoku Kitchen or Ndole at Traditional Taste in ${locationText}. Both are highly rated and match your preferences!`;
}

async function handleNavigateIntent(parameters: any): Promise<string> {
  const restaurant = parameters.restaurant || 'the selected restaurant';
  
  return `Getting directions to ${restaurant}. It's about 15 minutes away by car or 25 minutes by public transport. Would you like me to open the navigation app?`;
}

async function handleOrderIntent(parameters: any): Promise<string> {
  const restaurant = parameters.restaurant || 'your preferred restaurant';
  const dish = parameters.dish || 'your favorite dishes';
  
  return `I can help you order ${dish} from ${restaurant}. They're available on UberEats, Glovo, and Jumia Food. Which delivery service would you prefer?`;
}

function getSuggestions(intent: string): string[] {
  const suggestions = {
    search: [
      "Show me vegetarian options",
      "Find places under 5000 CFA",
      "What's open now?",
    ],
    recommend: [
      "Something spicy",
      "Healthy options",
      "Local specialties",
    ],
    navigate: [
      "Fastest route",
      "Public transport options",
      "Parking information",
    ],
    order: [
      "Check delivery time",
      "Compare prices",
      "Add to favorites",
    ],
  };

  return suggestions[intent as keyof typeof suggestions] || [];
}

function getActionButtons(intent: string, parameters: any): Array<{text: string, action: string}> {
  switch (intent) {
    case 'search':
      return [
        { text: "View Results", action: "navigate_search" },
        { text: "Filter Options", action: "open_filters" },
      ];
    case 'recommend':
      return [
        { text: "See Recommendations", action: "show_recommendations" },
        { text: "Save Preferences", action: "save_preferences" },
      ];
    case 'navigate':
      return [
        { text: "Open Maps", action: "open_navigation" },
        { text: "Call Restaurant", action: "call_restaurant" },
      ];
    case 'order':
      return [
        { text: "Place Order", action: "start_order" },
        { text: "View Menu", action: "show_menu" },
      ];
    default:
      return [];
  }
}

function getPopularIntents(history: VoiceCommand[]): Array<{intent: string, count: number}> {
  const intentCounts = history.reduce((acc, cmd) => {
    acc[cmd.intent] = (acc[cmd.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count);
}