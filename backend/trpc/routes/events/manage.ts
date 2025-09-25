import { z } from 'zod';
import { protectedProcedure } from '../../create-context';

// Mock events data
const mockEvents = [
  {
    id: '1',
    title: 'Douala Food Festival 2024',
    description: 'Join us for the biggest food festival in Cameroon featuring local and international cuisines',
    type: 'festival' as const,
    category: 'Cultural',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    location: {
      name: 'Bonanjo Convention Center',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      coordinates: {
        latitude: 4.0511,
        longitude: 9.7679,
      },
    },
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    price: {
      min: 2000,
      max: 5000,
      currency: 'XAF',
    },
    capacity: 500,
    attendeesCount: 234,
    isAttending: false,
    organizer: {
      id: 'org1',
      name: 'Cameroon Food Association',
      type: 'organization' as const,
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    },
    tags: ['festival', 'local-cuisine', 'international', 'family-friendly'],
    requirements: ['Valid ID required', 'No outside food or drinks'],
    contactInfo: {
      phone: '+237 6XX XXX XXX',
      email: 'info@cameroonfoods.cm',
      website: 'https://cameroonfoods.cm',
    },
    status: 'upcoming' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Street Food Pop-up',
    description: 'Discover the best street food vendors in Yaounde',
    type: 'popup' as const,
    category: 'Street Food',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    location: {
      name: 'Central Market Area',
      address: 'Marché Central, Centre-ville',
      city: 'Yaounde',
    },
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    attendeesCount: 45,
    isAttending: true,
    organizer: {
      id: 'user1',
      name: 'Marie Ngozi',
      type: 'user' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    },
    tags: ['street-food', 'local', 'affordable'],
    status: 'upcoming' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPolls = [
  {
    id: '1',
    question: 'What\'s the best Cameroonian dish?',
    description: 'Help us settle this debate once and for all!',
    type: 'single' as const,
    options: [
      { id: '1', text: 'Ndolé', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop', votes: 45, percentage: 35 },
      { id: '2', text: 'Poulet DG', imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=150&fit=crop', votes: 38, percentage: 30 },
      { id: '3', text: 'Koki', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop', votes: 25, percentage: 20 },
      { id: '4', text: 'Achu', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop', votes: 19, percentage: 15 },
    ],
    category: 'Food Debate',
    city: 'All Cities',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    createdBy: {
      id: 'user2',
      username: 'foodie_cam',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    totalVotes: 127,
    userVote: undefined,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
  },
];

const mockChallenges = [
  {
    id: '1',
    title: 'Best Burger Photo Challenge',
    description: 'Show us the most mouth-watering burger photo you can capture!',
    type: 'photo' as const,
    difficulty: 'easy' as const,
    category: 'Photography',
    rules: [
      'Photo must be original and taken by you',
      'Burger must be from a restaurant in Cameroon',
      'Include restaurant name in caption',
      'Use hashtag #BurgerChallengeCM',
    ],
    prize: {
      description: 'Free meal voucher worth 10,000 XAF',
      value: 10000,
      sponsor: 'Quick Burger Douala',
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    participantsCount: 23,
    isParticipating: false,
    submissions: [],
    status: 'active' as const,
    createdAt: new Date(),
  },
];

export const getEventsProcedure = protectedProcedure
  .input(z.object({
    city: z.string().optional(),
    type: z.enum(['festival', 'popup', 'restaurant_week', 'tasting', 'competition', 'workshop']).optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    // In a real app, filter and paginate from database
    let filteredEvents = mockEvents;
    
    if (input.city) {
      filteredEvents = filteredEvents.filter(e => e.location.city.toLowerCase() === input.city?.toLowerCase());
    }
    
    if (input.type) {
      filteredEvents = filteredEvents.filter(e => e.type === input.type);
    }
    
    if (input.status) {
      filteredEvents = filteredEvents.filter(e => e.status === input.status);
    }
    
    return {
      events: filteredEvents.slice(input.offset, input.offset + input.limit),
      total: filteredEvents.length,
      hasMore: input.offset + input.limit < filteredEvents.length,
    };
  });

export const attendEventProcedure = protectedProcedure
  .input(z.object({ 
    eventId: z.string(),
    status: z.enum(['going', 'interested', 'maybe'])
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, update attendance in database
    return { success: true };
  });

export const getPollsProcedure = protectedProcedure
  .input(z.object({
    city: z.string().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    // In a real app, filter and paginate from database
    let filteredPolls = mockPolls;
    
    if (input.isActive !== undefined) {
      filteredPolls = filteredPolls.filter(p => p.isActive === input.isActive);
    }
    
    return {
      polls: filteredPolls.slice(input.offset, input.offset + input.limit),
      total: filteredPolls.length,
      hasMore: input.offset + input.limit < filteredPolls.length,
    };
  });

export const votePollProcedure = protectedProcedure
  .input(z.object({ 
    pollId: z.string(),
    optionIds: z.array(z.string())
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, record vote in database
    return { success: true };
  });

export const getChallengesProcedure = protectedProcedure
  .input(z.object({
    type: z.enum(['photo', 'review', 'visit', 'recipe']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    status: z.enum(['upcoming', 'active', 'judging', 'completed']).optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    // In a real app, filter and paginate from database
    let filteredChallenges = mockChallenges;
    
    if (input.type) {
      filteredChallenges = filteredChallenges.filter(c => c.type === input.type);
    }
    
    if (input.status) {
      filteredChallenges = filteredChallenges.filter(c => c.status === input.status);
    }
    
    return {
      challenges: filteredChallenges.slice(input.offset, input.offset + input.limit),
      total: filteredChallenges.length,
      hasMore: input.offset + input.limit < filteredChallenges.length,
    };
  });

export const joinChallengeProcedure = protectedProcedure
  .input(z.object({ challengeId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // In a real app, add user to challenge participants
    return { success: true };
  });