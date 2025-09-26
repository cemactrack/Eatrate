import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/useDebounce';

// Optimized restaurant queries with better caching
export function useOptimizedRestaurants(city?: string, limit = 10) {
  const debouncedCity = useDebounce(city || '', 300);
  
  // Use existing tRPC hooks with optimizations
  const doualaQuery = trpc.restaurants.douala.useQuery(undefined, {
    enabled: !debouncedCity || debouncedCity.toLowerCase() === 'douala',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
  
  const yaoundeQuery = trpc.restaurants.yaounde.useQuery(undefined, {
    enabled: debouncedCity?.toLowerCase() === 'yaounde',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
  
  const bueaQuery = trpc.restaurants.buea.useQuery(undefined, {
    enabled: debouncedCity?.toLowerCase() === 'buea',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
  
  const limbeQuery = trpc.restaurants.limbe.useQuery(undefined, {
    enabled: debouncedCity?.toLowerCase() === 'limbe',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
  
  return useMemo(() => {
    const activeQuery = debouncedCity?.toLowerCase() === 'yaounde' ? yaoundeQuery
      : debouncedCity?.toLowerCase() === 'buea' ? bueaQuery
      : debouncedCity?.toLowerCase() === 'limbe' ? limbeQuery
      : doualaQuery;
    
    return {
      restaurants: activeQuery.data?.restaurants || [],
      total: activeQuery.data?.restaurants?.length || 0,
      isLoading: activeQuery.isLoading,
      error: activeQuery.error,
      refetch: activeQuery.refetch,
    };
  }, [debouncedCity, doualaQuery, yaoundeQuery, bueaQuery, limbeQuery]);
}

// Optimized posts feed with better caching
export function useOptimizedPostsFeed(type: 'recent' | 'trending' | 'following' = 'recent') {
  const feedQuery = trpc.posts.feed.useQuery(
    { type, limit: 20 },
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );
  
  // Optimistic like mutation
  const likeMutation = trpc.posts.like.useMutation({
    onMutate: async ({ postId }) => {
      // Optimistic update logic would go here
      console.log('Optimistically liking post:', postId);
    },
    onError: (error) => {
      console.error('Like error:', error);
    },
    onSuccess: () => {
      // Invalidate and refetch
      feedQuery.refetch();
    },
  });
  
  return {
    posts: feedQuery.data?.posts || [],
    isLoading: feedQuery.isLoading,
    error: feedQuery.error,
    refetch: feedQuery.refetch,
    likeMutation,
  };
}

// Optimized search with debouncing and caching
export function useOptimizedSearch(searchQuery: string, filters?: any) {
  const debouncedQuery = useDebounce(searchQuery?.trim() || '', 500);
  
  const searchResults = trpc.restaurants.search.useQuery(
    { 
      query: debouncedQuery, 
      limit: 10,
      ...filters 
    },
    {
      enabled: !!debouncedQuery && debouncedQuery.length >= 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: false,
    }
  );
  
  return {
    restaurants: searchResults.data?.restaurants || [],
    posts: [], // Posts search not implemented yet
    users: [], // Users search not implemented yet
    total: searchResults.data?.restaurants?.length || 0,
    isLoading: searchResults.isLoading,
    error: searchResults.error,
    refetch: searchResults.refetch,
  };
}

// Optimized user profile with selective loading
export function useOptimizedUserProfile(userId: string, includeStats = false) {
  const baseQuery = trpc.users.getProfile.useQuery(
    { userId },
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
  
  // Mock stats query for now
  const statsQuery = useQuery({
    queryKey: ['user', 'stats', userId],
    queryFn: () => Promise.resolve({
      totalPosts: 0,
      totalLikes: 0,
      totalFollowers: 0,
      totalFollowing: 0,
    }),
    enabled: !!userId && includeStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    profile: baseQuery.data,
    stats: statsQuery.data,
    isLoading: baseQuery.isLoading || (includeStats && statsQuery.isLoading),
    error: baseQuery.error || statsQuery.error,
    refetch: () => {
      baseQuery.refetch();
      if (includeStats) statsQuery.refetch();
    },
  };
}

// Background sync for critical data
export function useBackgroundSync() {
  const queryClient = useQueryClient();
  
  const syncCriticalData = useCallback(async () => {
    // Prefetch critical data in background using tRPC utils
    try {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: [['restaurants', 'douala'], { type: 'query' }],
          queryFn: () => fetch('/api/trpc/restaurants.douala').then(res => res.json()),
          staleTime: 1000 * 60 * 10,
        }),
        queryClient.prefetchQuery({
          queryKey: [['posts', 'feed'], { input: { type: 'trending', limit: 10 }, type: 'query' }],
          queryFn: () => fetch('/api/trpc/posts.feed?input=%7B%22type%22%3A%22trending%22%2C%22limit%22%3A10%7D').then(res => res.json()),
          staleTime: 1000 * 60 * 5,
        }),
      ]);
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }, [queryClient]);
  
  return { syncCriticalData };
}