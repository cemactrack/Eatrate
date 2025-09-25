export interface FoodRecognition {
  id: string;
  userId: string;
  imageUrl: string;
  recognizedFood: {
    name: string;
    confidence: number;
    cuisine?: string;
    category?: string;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  nearbyRestaurants: string[];
  createdAt: Date;
}

export interface DeliveryIntegration {
  id: string;
  restaurantId: string;
  provider: 'ubereats' | 'glovo' | 'jumia' | 'eatrate';
  isActive: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  coverageAreas: string[];
}

export interface ARPreview {
  id: string;
  dishId: string;
  modelUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  viewCount: number;
}

export interface LoyaltyPoints {
  id: string;
  userId: string;
  points: number;
  source: 'review' | 'post' | 'dining' | 'referral' | 'bonus';
  description: string;
  restaurantId?: string;
  createdAt: Date;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_meal' | 'partner_reward';
  value: number;
  restaurantId?: string;
  isActive: boolean;
  expiresAt?: Date;
}

export interface VoiceCommand {
  id: string;
  userId: string;
  command: string;
  intent: 'search' | 'recommend' | 'navigate' | 'order';
  parameters: Record<string, any>;
  response: string;
  createdAt: Date;
}

export interface HealthProfile {
  id: string;
  userId: string;
  dailyCalorieGoal: number;
  dietaryRestrictions: string[];
  allergies: string[];
  fitnessGoals: string[];
  preferredCuisines: string[];
  healthConditions: string[];
}

export interface FoodTrail {
  id: string;
  title: string;
  description: string;
  city: string;
  stops: {
    restaurantId: string;
    order: number;
    recommendedDish: string;
    estimatedTime: number;
  }[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  rating: number;
  completions: number;
  isActive: boolean;
}

export interface TourismSpot {
  id: string;
  name: string;
  description: string;
  city: string;
  category: 'street_food' | 'fine_dining' | 'local_specialty' | 'market';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  highlights: string[];
  bestTimeToVisit: string;
  priceRange: string;
  rating: number;
  photos: string[];
}