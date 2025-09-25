import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import type { DeliveryIntegration } from '@/types/advanced-features';

const mockDeliveryProviders: DeliveryIntegration[] = [
  {
    id: 'delivery_1',
    restaurantId: '1',
    provider: 'ubereats',
    isActive: true,
    deliveryFee: 1500,
    minimumOrder: 5000,
    estimatedTime: '25-35 min',
    coverageAreas: ['Douala Centre', 'Akwa', 'Bonanjo'],
  },
  {
    id: 'delivery_2',
    restaurantId: '1',
    provider: 'glovo',
    isActive: true,
    deliveryFee: 1200,
    minimumOrder: 4000,
    estimatedTime: '30-40 min',
    coverageAreas: ['Douala Centre', 'Akwa'],
  },
  {
    id: 'delivery_3',
    restaurantId: '2',
    provider: 'jumia',
    isActive: true,
    deliveryFee: 1000,
    minimumOrder: 3500,
    estimatedTime: '20-30 min',
    coverageAreas: ['Yaounde Centre', 'Bastos', 'Melen'],
  },
];

export const getDeliveryOptionsProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    userLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      area: z.string().optional(),
    }).optional(),
  }))
  .query(async ({ input }) => {
    console.log('[Delivery] Getting options for restaurant:', input.restaurantId);

    const options = mockDeliveryProviders.filter(
      provider => provider.restaurantId === input.restaurantId && provider.isActive
    );

    return {
      options,
      hasDelivery: options.length > 0,
      fastestOption: options.reduce((fastest, current) => {
        const fastestTime = parseInt(fastest.estimatedTime.split('-')[0]);
        const currentTime = parseInt(current.estimatedTime.split('-')[0]);
        return currentTime < fastestTime ? current : fastest;
      }, options[0]),
      cheapestOption: options.reduce((cheapest, current) => 
        current.deliveryFee < cheapest.deliveryFee ? current : cheapest
      , options[0]),
    };
  });

export const initiateOrderProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    provider: z.enum(['ubereats', 'glovo', 'jumia', 'eatrate']),
    items: z.array(z.object({
      dishId: z.string(),
      quantity: z.number().min(1),
      specialInstructions: z.string().optional(),
    })),
    deliveryAddress: z.object({
      street: z.string(),
      area: z.string(),
      city: z.string(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    }),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Delivery] Initiating order for user:', ctx.user.id);

    const deliveryOption = mockDeliveryProviders.find(
      p => p.restaurantId === input.restaurantId && p.provider === input.provider
    );

    if (!deliveryOption) {
      throw new Error('Delivery option not available');
    }

    const orderId = `order_${Date.now()}`;
    const estimatedTotal = input.items.length * 8000 + deliveryOption.deliveryFee;

    switch (input.provider) {
      case 'ubereats':
        return {
          orderId,
          redirectUrl: `https://ubereats.com/order/${orderId}`,
          estimatedTotal,
          estimatedDelivery: deliveryOption.estimatedTime,
          trackingCode: `UE${orderId.slice(-6)}`,
        };
      
      case 'glovo':
        return {
          orderId,
          redirectUrl: `https://glovoapp.com/order/${orderId}`,
          estimatedTotal,
          estimatedDelivery: deliveryOption.estimatedTime,
          trackingCode: `GL${orderId.slice(-6)}`,
        };
      
      case 'jumia':
        return {
          orderId,
          redirectUrl: `https://food.jumia.cm/order/${orderId}`,
          estimatedTotal,
          estimatedDelivery: deliveryOption.estimatedTime,
          trackingCode: `JF${orderId.slice(-6)}`,
        };
      
      case 'eatrate':
        return {
          orderId,
          redirectUrl: null,
          estimatedTotal,
          estimatedDelivery: deliveryOption.estimatedTime,
          trackingCode: `ER${orderId.slice(-6)}`,
          message: 'EatRate Delivery coming soon! Order placed in queue.',
        };
      
      default:
        throw new Error('Unsupported delivery provider');
    }
  });

export const trackOrderProcedure = protectedProcedure
  .input(z.object({
    orderId: z.string(),
    trackingCode: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    console.log('[Delivery] Tracking order:', input.orderId, 'for user:', ctx.user.id);

    const mockStatuses = [
      'Order confirmed',
      'Restaurant preparing',
      'Ready for pickup',
      'Driver assigned',
      'On the way',
      'Delivered',
    ];

    const currentStatusIndex = Math.floor(Math.random() * mockStatuses.length);

    return {
      orderId: input.orderId,
      trackingCode: input.trackingCode,
      status: mockStatuses[currentStatusIndex],
      estimatedArrival: new Date(Date.now() + 1800000).toISOString(),
      driverInfo: currentStatusIndex >= 3 ? {
        name: 'Jean-Paul',
        phone: '+237 6XX XXX XXX',
        vehicle: 'Motorcycle',
        rating: 4.8,
      } : null,
      timeline: mockStatuses.slice(0, currentStatusIndex + 1).map((status, index) => ({
        status,
        timestamp: new Date(Date.now() - (mockStatuses.length - index) * 300000).toISOString(),
        completed: true,
      })),
    };
  });