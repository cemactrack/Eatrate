import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '../../create-context';
import { PremiumSubscription, SponsoredListing, Reward } from '@/types/restaurant';

// Mock data for premium subscriptions
const mockSubscriptions: PremiumSubscription[] = [
  {
    id: '1',
    userId: 'user1',
    plan: 'premium',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    autoRenew: true,
    features: ['ad-free', 'exclusive-offers', 'priority-support', 'advanced-filters'],
    price: {
      amount: 9.99,
      currency: 'USD',
      interval: 'monthly'
    }
  }
];

const mockSponsoredListings: SponsoredListing[] = [
  {
    id: '1',
    restaurantId: 'rest1',
    restaurant: {
      id: 'rest1',
      name: 'Le Bistro',
      cuisine: 'French',
      rating: 4.5,
      reviewCount: 120,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      address: 'Douala, Cameroon',
      priceRange: '$$$',
      isOpen: true,
      tags: ['romantic', 'fine-dining'],
      verified: true,
      claimed: true
    },
    type: 'featured',
    position: 1,
    budget: 500,
    impressions: 15000,
    clicks: 450,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    isActive: true,
    targetAudience: {
      cities: ['Douala', 'Yaounde'],
      cuisines: ['French', 'European'],
      ageGroups: ['25-34', '35-44']
    }
  }
];

const mockRewards: Reward[] = [
  {
    id: '1',
    title: '20% Off Your Next Meal',
    description: 'Get 20% discount on your next order at participating restaurants',
    type: 'discount',
    value: 20,
    code: 'FOODIE20',
    expiresAt: '2024-12-31',
    isRedeemed: false,
    conditions: ['Minimum order $25', 'Valid at participating restaurants only']
  },
  {
    id: '2',
    title: 'Free Appetizer',
    description: 'Complimentary appetizer with main course purchase',
    type: 'freebie',
    value: 0,
    restaurantId: 'rest1',
    expiresAt: '2024-06-30',
    isRedeemed: false,
    conditions: ['Valid with main course purchase', 'One per customer']
  }
];

// Get user subscription
export const getUserSubscriptionProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[getUserSubscription] Fetching subscription for user:', ctx.user?.id);
    
    // Mock implementation
    const subscription = mockSubscriptions.find(s => s.userId === ctx.user?.id);
    
    return subscription || null;
  });

// Get subscription plans
export const getSubscriptionPlansProcedure = publicProcedure
  .query(async () => {
    console.log('[getSubscriptionPlans] Fetching available plans');
    
    return [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Essential features for food lovers',
        price: { amount: 0, currency: 'USD', interval: 'monthly' as const },
        features: [
          'Browse restaurants',
          'Write reviews',
          'Basic search filters',
          'Follow users'
        ],
        popular: false
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Enhanced experience with exclusive perks',
        price: { amount: 9.99, currency: 'USD', interval: 'monthly' as const },
        features: [
          'All Basic features',
          'Ad-free experience',
          'Exclusive restaurant offers',
          'Priority customer support',
          'Advanced search filters',
          'Unlimited bookmarks',
          'Early access to events'
        ],
        popular: true
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Ultimate foodie experience',
        price: { amount: 19.99, currency: 'USD', interval: 'monthly' as const },
        features: [
          'All Premium features',
          'Restaurant insights dashboard',
          'Personalized recommendations',
          'VIP event invitations',
          'Concierge reservation service',
          'Monthly reward credits',
          'Beta feature access'
        ],
        popular: false
      }
    ];
  });

// Subscribe to plan
export const subscribeToPlanProcedure = protectedProcedure
  .input(z.object({
    planId: z.string(),
    interval: z.enum(['monthly', 'yearly']),
    paymentMethodId: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[subscribeToPlan] User subscribing to plan:', input.planId);
    
    // Mock implementation - in real app, integrate with payment processor
    const newSubscription: PremiumSubscription = {
      id: Date.now().toString(),
      userId: ctx.user?.id || '',
      plan: input.planId as 'basic' | 'premium' | 'pro',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (input.interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      features: [],
      price: {
        amount: input.planId === 'premium' ? 9.99 : input.planId === 'pro' ? 19.99 : 0,
        currency: 'USD',
        interval: input.interval
      }
    };
    
    mockSubscriptions.push(newSubscription);
    
    return {
      success: true,
      subscription: newSubscription,
      message: `Successfully subscribed to ${input.planId} plan!`
    };
  });

// Cancel subscription
export const cancelSubscriptionProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    console.log('[cancelSubscription] Cancelling subscription for user:', ctx.user?.id);
    
    const subscriptionIndex = mockSubscriptions.findIndex(s => s.userId === ctx.user?.id);
    if (subscriptionIndex !== -1) {
      mockSubscriptions[subscriptionIndex].status = 'cancelled';
      mockSubscriptions[subscriptionIndex].autoRenew = false;
    }
    
    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };
  });

// Get sponsored listings
export const getSponsoredListingsProcedure = publicProcedure
  .input(z.object({
    city: z.string().optional(),
    cuisine: z.string().optional(),
    limit: z.number().default(5)
  }))
  .query(async ({ input }) => {
    console.log('[getSponsoredListings] Fetching sponsored listings:', input);
    
    let filtered = mockSponsoredListings.filter(listing => listing.isActive);
    
    if (input.city) {
      filtered = filtered.filter(listing => 
        listing.targetAudience.cities.includes(input.city!)
      );
    }
    
    if (input.cuisine) {
      filtered = filtered.filter(listing => 
        listing.targetAudience.cuisines.includes(input.cuisine!)
      );
    }
    
    return filtered
      .sort((a, b) => a.position - b.position)
      .slice(0, input.limit);
  });

// Get user rewards
export const getUserRewardsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[getUserRewards] Fetching rewards for user:', ctx.user?.id);
    
    // Mock implementation - filter active, non-expired rewards
    const now = new Date();
    return mockRewards.filter(reward => 
      !reward.isRedeemed && new Date(reward.expiresAt) > now
    );
  });

// Redeem reward
export const redeemRewardProcedure = protectedProcedure
  .input(z.object({
    rewardId: z.string(),
    restaurantId: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[redeemReward] Redeeming reward:', input.rewardId);
    
    const rewardIndex = mockRewards.findIndex(r => r.id === input.rewardId);
    if (rewardIndex === -1) {
      throw new Error('Reward not found');
    }
    
    const reward = mockRewards[rewardIndex];
    if (reward.isRedeemed) {
      throw new Error('Reward already redeemed');
    }
    
    if (new Date(reward.expiresAt) < new Date()) {
      throw new Error('Reward has expired');
    }
    
    // Mark as redeemed
    mockRewards[rewardIndex].isRedeemed = true;
    mockRewards[rewardIndex].redeemedAt = new Date().toISOString();
    
    return {
      success: true,
      message: 'Reward redeemed successfully!',
      reward: mockRewards[rewardIndex]
    };
  });

// Get delivery partners
export const getDeliveryPartnersProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    city: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log('[getDeliveryPartners] Fetching delivery partners for restaurant:', input.restaurantId);
    
    // Mock delivery partners
    const partners = [
      {
        id: '1',
        name: 'UberEats',
        logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        deepLink: 'ubereats://restaurant/' + input.restaurantId,
        commission: 15,
        isActive: true,
        supportedCities: ['Douala', 'Yaounde', 'Buea']
      },
      {
        id: '2',
        name: 'Glovo',
        logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        deepLink: 'glovo://restaurant/' + input.restaurantId,
        commission: 18,
        isActive: true,
        supportedCities: ['Douala', 'Yaounde']
      },
      {
        id: '3',
        name: 'Jumia Food',
        logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        deepLink: 'jumiafood://restaurant/' + input.restaurantId,
        commission: 20,
        isActive: true,
        supportedCities: ['Douala', 'Yaounde', 'Buea', 'Limbe']
      }
    ];
    
    return partners.filter(partner => 
      partner.isActive && 
      (!input.city || partner.supportedCities.includes(input.city))
    );
  });