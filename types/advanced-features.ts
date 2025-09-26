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
