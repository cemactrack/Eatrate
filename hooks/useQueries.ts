import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { APP_CONFIG } from '@/constants/app-config';
import { Restaurant, Post, Dish, User } from '@/types/restaurant';

// Restaurant hooks
export function useRestaurants(city?: string) {
  const query = trpc.restaurants.list.useQuery(undefined, {
    staleTime: APP_CONFIG.api.staleTime,
    retry: APP_CONFIG.api.retryAttempts,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const fallbackQuery = trpc.restaurants.yaounde.useQuery(
    { page: 1 },
    {
      enabled: !query.data?.restaurants?.length && !query.isLoading && !!query.error,
      staleTime: APP_CONFIG.api.staleTime,
      retry: 0,
    }
  );

  const restaurants = useMemo(() => {
    const mainList = query.data?.restaurants ?? [];
    const fallbackList = fallbackQuery.data?.restaurants ?? [];
    return mainList.length > 0 ? mainList : fallbackList;
  }, [query.data?.restaurants, fallbackQuery.data?.restaurants]);

  return {
    restaurants,
    isLoading: query.isLoading && fallbackQuery.isLoading,
    error: query.error || fallbackQuery.error,
    refetch: query.refetch,
  };
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
    staleTime: APP_CONFIG.api.staleTime * 1.5, // Longer for dishes
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
    staleTime: APP_CONFIG.api.staleTime * 1.5, // Longer for users
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

// Optimistic mutations
export function useOptimisticLike() {
  const utils = trpc.useUtils();
  
  return trpc.posts.like.useMutation({
    onMutate: async ({ postId }) => {
      await utils.posts.feed.cancel({ type: 'recent', limit: 10 });
      
      const previousData = utils.posts.feed.getInfiniteData({ type: 'recent', limit: 10 });
      
      utils.posts.feed.setInfiniteData({ type: 'recent', limit: 10 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(post => 
              post.id === postId 
                ? { 
                    ...post, 
                    isLiked: !post.isLiked, 
                    likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 
                  }
                : post
            )
          }))
        };
      });
      
      return { previousData };
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
  
  return trpc.users.follow.useMutation({
    onMutate: async ({ targetUserId }) => {
      await utils.users.list.cancel();
      
      const previousData = utils.users.list.getData();
      
      utils.users.list.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map(user => 
            user.id === targetUserId 
              ? { 
                  ...user, 
                  isFollowing: !(user as any).isFollowing,
                  followersCount: (user as any).isFollowing 
                    ? user.followersCount - 1 
                    : user.followersCount + 1
                }
              : user
          )
        };
      });
      
      return { previousData };
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