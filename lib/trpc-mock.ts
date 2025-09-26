// Mock tRPC client for development when API routes are not working
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

// Mock data for development
const mockData = {
  restaurants: [
    {
      id: '1',
      name: 'Le Beau Restaurant',
      cuisine: 'French',
      rating: 4.5,
      location: 'Yaoundé',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      description: 'Authentic French cuisine in the heart of Yaoundé'
    },
    {
      id: '2', 
      name: 'Mama Africa',
      cuisine: 'African',
      rating: 4.2,
      location: 'Douala',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      description: 'Traditional African dishes with a modern twist'
    }
  ],
  posts: [
    {
      id: '1',
      content: 'Just had an amazing meal at Le Beau Restaurant!',
      author: { name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
      timestamp: new Date().toISOString(),
      likes: 12,
      comments: 3
    }
  ],
  users: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    }
  ]
};

// Create a mock client that returns the mock data
export const trpcClient = {
  restaurants: {
    list: { query: async () => mockData.restaurants },
    yaounde: { query: async () => ({ restaurants: mockData.restaurants.filter(r => r.location === 'Yaoundé'), total: 1 }) },
    douala: { query: async () => ({ restaurants: mockData.restaurants.filter(r => r.location === 'Douala'), total: 1 }) },
    buea: { query: async () => ({ restaurants: [], total: 0 }) },
    limbe: { query: async () => ({ restaurants: [], total: 0 }) },
  },
  posts: {
    feed: { query: async () => ({ posts: mockData.posts, nextCursor: null }) },
    list: { query: async () => mockData.posts },
  },
  users: {
    list: { query: async () => mockData.users },
  },
  dishes: {
    list: { query: async () => [] },
  },
  notifications: {
    getAll: { query: async () => [] },
    getSettings: { query: async () => ({ email: true, push: true, sms: false }) },
  },
  messaging: {
    getConversations: { query: async () => [] },
    getUnreadCount: { query: async () => 0 },
  },
  gamification: {
    getStats: { query: async () => ({ points: 0, level: 1, badges: [] }) },
  },
  healthCheck: { query: async () => ({ status: 'ok', message: 'Mock client working' }) }
};

console.log('[Mock tRPC] Using mock tRPC client for development');