// Mock tRPC client for development when API routes are not working
import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
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

// Create a mock client that intercepts requests and returns mock data
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: 'http://mock-api/trpc', // This will never be called
      fetch: async (url, options) => {
        console.log('[Mock tRPC] Intercepting request:', url);
        
        // Parse the URL to determine which endpoint is being called
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const searchParams = urlObj.searchParams;
        const input = searchParams.get('input');
        
        let mockResponse;
        
        if (path.includes('restaurants.list')) {
          mockResponse = mockData.restaurants;
        } else if (path.includes('restaurants.yaounde')) {
          mockResponse = { restaurants: mockData.restaurants.filter(r => r.location === 'Yaoundé'), total: 1 };
        } else if (path.includes('restaurants.douala')) {
          mockResponse = { restaurants: mockData.restaurants.filter(r => r.location === 'Douala'), total: 1 };
        } else if (path.includes('posts.feed')) {
          mockResponse = { posts: mockData.posts, nextCursor: null };
        } else if (path.includes('posts.list')) {
          mockResponse = mockData.posts;
        } else if (path.includes('users.list')) {
          mockResponse = mockData.users;
        } else if (path.includes('notifications.getAll')) {
          mockResponse = [];
        } else if (path.includes('notifications.getSettings')) {
          mockResponse = { email: true, push: true, sms: false };
        } else if (path.includes('messaging.getConversations')) {
          mockResponse = [];
        } else if (path.includes('messaging.getUnreadCount')) {
          mockResponse = 0;
        } else if (path.includes('gamification.getStats')) {
          mockResponse = { points: 0, level: 1, badges: [] };
        } else if (path.includes('dishes.list')) {
          mockResponse = [];
        } else if (path.includes('healthCheck')) {
          mockResponse = { status: 'ok', message: 'Mock client working' };
        } else {
          mockResponse = { status: 'ok', message: 'Mock response' };
        }
        
        return new Response(JSON.stringify({ result: { data: mockResponse } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    }),
  ],
});

console.log('[Mock tRPC] Using mock tRPC client for development');