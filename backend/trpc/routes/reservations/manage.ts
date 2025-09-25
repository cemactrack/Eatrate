import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import type { Reservation } from '@/types/restaurant';

const mockReservations: Reservation[] = [
  {
    id: '1',
    userId: 'user1',
    restaurantId: 'rest1',
    restaurant: {
      id: 'rest1',
      name: 'Le Bistro Camerounais',
      cuisine: 'African',
      rating: 4.5,
      reviewCount: 120,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      address: 'Douala, Cameroon',
      priceRange: '$$',
      isOpen: true,
      tags: ['African', 'Traditional']
    },
    date: '2024-01-15',
    time: '19:00',
    partySize: 4,
    specialRequests: 'Window table preferred',
    status: 'confirmed',
    confirmationCode: 'RES001',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    userId: 'user1',
    restaurantId: 'rest2',
    restaurant: {
      id: 'rest2',
      name: 'Ocean View Restaurant',
      cuisine: 'Seafood',
      rating: 4.2,
      reviewCount: 85,
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
      address: 'Limbe, Cameroon',
      priceRange: '$$$',
      isOpen: true,
      tags: ['Seafood', 'Ocean View']
    },
    date: '2024-01-20',
    time: '18:30',
    partySize: 2,
    status: 'pending',
    confirmationCode: 'RES002',
    createdAt: '2024-01-12T14:30:00Z'
  }
];

const mockAvailableSlots = [
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

export const getReservationsProcedure = protectedProcedure
  .input(z.object({
    status: z.enum(['all', 'pending', 'confirmed', 'cancelled', 'completed']).optional().default('all'),
    limit: z.number().min(1).max(50).optional().default(20),
    offset: z.number().min(0).optional().default(0)
  }))
  .query(async ({ input }) => {
    console.log('📅 Fetching user reservations:', input);
    
    let filteredReservations = mockReservations;
    
    if (input.status !== 'all') {
      filteredReservations = mockReservations.filter(r => r.status === input.status);
    }
    
    const paginatedReservations = filteredReservations.slice(
      input.offset,
      input.offset + input.limit
    );
    
    return {
      reservations: paginatedReservations,
      total: filteredReservations.length,
      hasMore: input.offset + input.limit < filteredReservations.length
    };
  });

export const getAvailabilityProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    date: z.string(),
    partySize: z.number().min(1).max(20)
  }))
  .query(async ({ input }) => {
    console.log('🕐 Checking availability:', input);
    
    // Simulate availability check
    const unavailableSlots = ['18:00', '19:30']; // Mock unavailable slots
    const availableSlots = mockAvailableSlots.filter(slot => {
      if (!slot || typeof slot !== 'string') return false;
      return !unavailableSlots.includes(slot);
    });
    
    return {
      date: input.date,
      availableSlots,
      fullyBooked: availableSlots.length === 0,
      nextAvailableDate: availableSlots.length === 0 ? '2024-01-16' : null
    };
  });

export const createReservationProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    date: z.string(),
    time: z.string(),
    partySize: z.number().min(1).max(20),
    specialRequests: z.string().optional(),
    contactInfo: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email().optional()
    })
  }))
  .mutation(async ({ input }) => {
    console.log('📝 Creating reservation:', input);
    
    const confirmationCode = `RES${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const newReservation: Reservation = {
      id: `res_${Date.now()}`,
      userId: 'current_user',
      restaurantId: input.restaurantId,
      restaurant: {
        id: input.restaurantId,
        name: 'Selected Restaurant',
        cuisine: 'Various',
        rating: 4.0,
        reviewCount: 50,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        address: 'Cameroon',
        priceRange: '$$',
        isOpen: true,
        tags: ['Restaurant']
      },
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      specialRequests: input.specialRequests,
      status: 'pending',
      confirmationCode,
      createdAt: new Date().toISOString()
    };
    
    mockReservations.unshift(newReservation);
    
    return {
      reservation: newReservation,
      message: 'Reservation created successfully! You will receive a confirmation shortly.'
    };
  });

export const updateReservationProcedure = protectedProcedure
  .input(z.object({
    reservationId: z.string(),
    action: z.enum(['cancel', 'modify']),
    modifications: z.object({
      date: z.string().optional(),
      time: z.string().optional(),
      partySize: z.number().min(1).max(20).optional(),
      specialRequests: z.string().optional()
    }).optional()
  }))
  .mutation(async ({ input }) => {
    console.log('✏️ Updating reservation:', input);
    
    const reservationIndex = mockReservations.findIndex(r => r.id === input.reservationId);
    
    if (reservationIndex === -1) {
      throw new Error('Reservation not found');
    }
    
    if (input.action === 'cancel') {
      mockReservations[reservationIndex].status = 'cancelled';
      return {
        message: 'Reservation cancelled successfully',
        reservation: mockReservations[reservationIndex]
      };
    }
    
    if (input.action === 'modify' && input.modifications) {
      const reservation = mockReservations[reservationIndex];
      Object.assign(reservation, input.modifications);
      reservation.status = 'pending'; // Reset to pending for re-confirmation
      
      return {
        message: 'Reservation modified successfully. Awaiting confirmation.',
        reservation
      };
    }
    
    throw new Error('Invalid action');
  });

export const getReservationDetailsProcedure = protectedProcedure
  .input(z.object({
    reservationId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('📋 Fetching reservation details:', input.reservationId);
    
    const reservation = mockReservations.find(r => r.id === input.reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    return {
      reservation,
      canCancel: reservation.status === 'pending' || reservation.status === 'confirmed',
      canModify: reservation.status === 'pending' || reservation.status === 'confirmed',
      cancellationPolicy: 'Free cancellation up to 2 hours before reservation time'
    };
  });