export interface NutritionInfo {
  calories: number;
  confidence: number; // 0-1 confidence score
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
    sugar: number; // grams
  };
  vitamins?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB12?: number;
    folate?: number;
  };
  minerals?: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    sodium?: number;
    zinc?: number;
  };
  allergens: string[];
  dietaryTags: DietaryTag[];
  servingSize?: {
    amount: number;
    unit: string;
  };
  ingredients?: string[];
  analysisMethod: 'ai_vision' | 'manual' | 'database';
  analyzedAt: Date;
}

export interface DietaryTag {
  id: string;
  name: string;
  category: 'diet' | 'allergen' | 'preference';
  icon?: string;
  color?: string;
}

export interface CalorieEstimationRequest {
  imageBase64: string;
  dishName?: string;
  restaurantContext?: string;
  servingSize?: string;
}

export interface CalorieEstimationResponse {
  nutrition: NutritionInfo;
  recognizedFood: {
    name: string;
    confidence: number;
    alternatives?: string[];
  };
  portionEstimate: {
    size: 'small' | 'medium' | 'large';
    weight?: number; // grams
    confidence: number;
  };
}

// Common dietary tags
export const DIETARY_TAGS: DietaryTag[] = [
  { id: 'vegan', name: 'Vegan', category: 'diet', icon: '🌱', color: '#22c55e' },
  { id: 'vegetarian', name: 'Vegetarian', category: 'diet', icon: '🥬', color: '#16a34a' },
  { id: 'gluten-free', name: 'Gluten Free', category: 'allergen', icon: '🌾', color: '#f59e0b' },
  { id: 'dairy-free', name: 'Dairy Free', category: 'allergen', icon: '🥛', color: '#3b82f6' },
  { id: 'halal', name: 'Halal', category: 'diet', icon: '☪️', color: '#10b981' },
  { id: 'kosher', name: 'Kosher', category: 'diet', icon: '✡️', color: '#6366f1' },
  { id: 'keto', name: 'Keto', category: 'diet', icon: '🥑', color: '#84cc16' },
  { id: 'paleo', name: 'Paleo', category: 'diet', icon: '🥩', color: '#dc2626' },
  { id: 'low-carb', name: 'Low Carb', category: 'preference', icon: '📉', color: '#f97316' },
  { id: 'high-protein', name: 'High Protein', category: 'preference', icon: '💪', color: '#ef4444' },
  { id: 'spicy', name: 'Spicy', category: 'preference', icon: '🌶️', color: '#dc2626' },
  { id: 'nuts', name: 'Contains Nuts', category: 'allergen', icon: '🥜', color: '#92400e' },
  { id: 'seafood', name: 'Seafood', category: 'allergen', icon: '🐟', color: '#0ea5e9' },
];