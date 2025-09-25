import { useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { APP_CONFIG } from '@/constants/app-config';
import { Restaurant, Post, Dish, User } from '@/types/restaurant';

// Restaurant hooks - now using the optimized version
export function useRestaurants(city?: string) {
  return useRestaurantsWithFallback(city);
}

export function useFeaturedRestaurants(limit = 3) {
  const { restaurants, isLoading, error } = useRestaurants();
  
  const featured = useMemo(() => 
    restaurants.slice(0, limit) as Restaurant[], 
    [restaurants, limit]
  );

  return { restaurants: featured, isLoading, error };
}

// Posts hooks
export function usePostsFeed(type: 'recent' | 'trending' = 'recent', limit = 10) {
  return trpc.posts.feed.useInfiniteQuery(
    { type, limit },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      staleTime: APP_CONFIG.api.staleTime * 0.7, // Shorter for feed
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
}

export function useTrendingPosts(limit = 2) {
  const query = usePostsFeed('trending', limit);
  
  const posts = useMemo(() => {
    if (!query.data?.pages?.length) return [] as Post[];
    return query.data.pages.flatMap(page => page.posts || []).slice(0, limit) as Post[];
  }, [query.data?.pages, limit]);

  return {
    posts,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Dishes hooks
export function useTrendingDishes(limit = 10, enabled = true) {
  const query = trpc.dishes.list.useQuery(undefined, {
    staleTime: APP_CONFIG.cache.dishes,
    enabled,
    retry: 0,
  });

  const dishes = useMemo(() => 
    (query.data?.dishes ?? []).slice(0, limit) as Dish[], 
    [query.data?.dishes, limit]
  );

  return {
    dishes,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Users hooks
export function useTopFoodies(limit = 10, enabled = true) {
  const query = trpc.users.list.useQuery(undefined, {
    staleTime: APP_CONFIG.cache.userProfile,
    enabled,
    retry: 0,
  });

  const users = useMemo(() => 
    (query.data?.users ?? []).slice(0, limit) as User[], 
    [query.data?.users, limit]
  );

  return {
    users,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Optimistic mutations with improved error handling
export function useOptimisticLike() {
  const utils = trpc.useUtils();
  
  const optimisticUpdate = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    const currentData = utils.posts.feed.getInfiniteData({ type: 'recent', limit: 10 });
    if (!currentData) return null;
    
    return {
      ...currentData,
      pages: currentData.pages.map(page => ({
        ...page,
        posts: page.posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !isLiked, 
                likesCount: isLiked ? likesCount - 1 : likesCount + 1 
              }
            : post
        )
      }))
    };
  }, [utils]);
  
  return trpc.posts.like.useMutation({
    onMutate: async ({ postId }) => {
      try {
        await utils.posts.feed.cancel({ type: 'recent', limit: 10 });
        
        const previousData = utils.posts.feed.getInfiniteData({ type: 'recent', limit: 10 });
        const currentPost = previousData?.pages
          .flatMap(page => page.posts)
          .find(post => post.id === postId);
        
        if (currentPost) {
          const updatedData = optimisticUpdate(postId, currentPost.isLiked, currentPost.likesCount);
          if (updatedData) {
            utils.posts.feed.setInfiniteData({ type: 'recent', limit: 10 }, updatedData);
          }
        }
        
        return { previousData };
      } catch (error) {
        console.error('[useOptimisticLike] Mutation setup error:', error);
        return { previousData: null };
      }
    },
    onError: (error, variables, context) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[useOptimisticLike] Error:', errorMessage);
      if (context?.previousData) {
        utils.posts.feed.setInfiniteData({ type: 'recent', limit: 10 }, context.previousData);
      }
    },
    onSettled: () => {
      utils.posts.feed.invalidate({ type: 'recent', limit: 10 }).catch(console.error);
    }
  });
}

export function useOptimisticFollow() {
  const utils = trpc.useUtils();
  
  const optimisticFollowUpdate = useCallback((targetUserId: string, currentFollowState: boolean, currentCount: number) => {
    const previousData = utils.users.list.getData();
    if (!previousData) return null;
    
    return {
      ...previousData,
      users: previousData.users.map(user => 
        user.id === targetUserId 
          ? { 
              ...user, 
              isFollowing: !currentFollowState,
              followersCount: currentFollowState 
                ? currentCount - 1 
                : currentCount + 1
            }
          : user
      )
    };
  }, [utils]);
  
  return trpc.users.follow.useMutation({
    onMutate: async ({ targetUserId }) => {
      try {
        await utils.users.list.cancel();
        
        const previousData = utils.users.list.getData();
        const currentUser = previousData?.users.find(user => user.id === targetUserId);
        
        if (currentUser) {
          const updatedData = optimisticFollowUpdate(
            targetUserId, 
            (currentUser as any).isFollowing || false, 
            currentUser.followersCount
          );
          
          if (updatedData) {
            utils.users.list.setData(undefined, updatedData);
          }
        }
        
        return { previousData };
      } catch (error) {
        console.error('[useOptimisticFollow] Mutation setup error:', error);
        return { previousData: null };
      }
    },
    onError: (error, variables, context) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[useOptimisticFollow] Error:', errorMessage);
      if (context?.previousData) {
        utils.users.list.setData(undefined, context.previousData);
      }
    },
    onSettled: () => {
      utils.users.list.invalidate().catch(console.error);
    }
  });
}

// New hook for search functionality
export function useSearchRestaurants(query: string, filters?: {
  cuisine?: string;
  priceRange?: ('$' | '$$' | '$$$' | '$$$$')[];
  rating?: number;
  location?: 'all' | 'douala' | 'yaounde' | 'buea' | 'limbe';
}) {
  const enabled = query.trim().length > 0;
  
  return trpc.restaurants.search.useQuery(
    { query: query.trim(), ...filters },
    {
      enabled,
      staleTime: APP_CONFIG.api.staleTime * 0.5, // Shorter for search
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );
}

// New hook for infinite scroll posts
export function useInfinitePostsFeed(type: 'recent' | 'trending' = 'recent') {
  return trpc.posts.feed.useInfiniteQuery(
    { type, limit: APP_CONFIG.pagination.defaultPageSize },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      staleTime: APP_CONFIG.cache.posts,
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
}

// Performance optimized restaurant hook with fallback
export function useRestaurantsWithFallback(city?: string) {
  const primaryQuery = trpc.restaurants.list.useQuery(undefined, {
    staleTime: APP_CONFIG.cache.restaurants,
    retry: 1,
    refetchOnMount: false,
  });

  const fallbackQuery = trpc.restaurants.yaounde.useQuery(
    { page: 1 },
    {
      enabled: !primaryQuery.data?.restaurants?.length && !primaryQuery.isLoading && !!primaryQuery.error,
      staleTime: APP_CONFIG.cache.restaurants,
      retry: 0,
    }
  );

  const restaurants = useMemo(() => {
    const mainList = primaryQuery.data?.restaurants ?? [];
    const fallbackList = fallbackQuery.data?.restaurants ?? [];
    return mainList.length > 0 ? mainList : fallbackList;
  }, [primaryQuery.data?.restaurants, fallbackQuery.data?.restaurants]);

  return {
    restaurants,
    isLoading: primaryQuery.isLoading || (fallbackQuery.isLoading && !primaryQuery.data),
    error: primaryQuery.error || fallbackQuery.error,
    refetch: primaryQuery.refetch,
    hasData: restaurants.length > 0,
  };
}