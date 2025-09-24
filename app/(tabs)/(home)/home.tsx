import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, MapPin, Users, Flame, Plus, UserPlus, Heart, MessageSquare, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc';
import { Restaurant, Post, Dish, User } from '@/types/restaurant';
import RestaurantCard from '@/components/RestaurantCard';
import DishCard from '@/components/DishCard';
import SearchBar from '@/components/SearchBar';
import Colors, { gradients } from '@/constants/colors';
import PostComposer from '@/components/PostComposer';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { useAuth } from '@/providers/AuthProvider';
import { useAdmin } from '@/providers/AdminProvider';

interface TrendingPostProps {
  post: Post;
  onPress: () => void;
  onLike: (postId: string) => void;
  onComments: (postId: string) => void;
}

const TrendingPost = React.memo(function TrendingPost({ post, onPress, onLike, onComments }: TrendingPostProps) {
  return (
    <TouchableOpacity style={styles.trendingPost} onPress={onPress}>
      <Image
        source={{ uri: post.content.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' }}
        style={styles.trendingImage}
        resizeMode="cover"
      />
      <View style={styles.trendingContent}>
        <View style={styles.trendingHeader}>
          <Image source={{ uri: post.user.avatar }} style={styles.trendingAvatar} />
          <View style={styles.trendingUserInfo}>
            <Text style={styles.trendingUsername}>{post.user.displayName}</Text>
            {post.restaurant && (
              <Text style={styles.trendingRestaurant}>{post.restaurant.name}</Text>
            )}
          </View>
        </View>
        <Text style={styles.trendingText} numberOfLines={2}>
          {post.content.text}
        </Text>
        <View style={styles.trendingStats}>
          <TouchableOpacity
            testID={`post-like-${post.id}`}
            style={styles.trendingStatBtn}
            onPress={() => onLike(post.id)}
            activeOpacity={0.8}
          >
            <Heart size={14} color={Colors.light.tint} />
            <Text style={styles.trendingLikes}>{post.likesCount} likes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`post-comments-${post.id}`}
            style={styles.trendingStatBtn}
            onPress={() => onComments(post.id)}
            activeOpacity={0.8}
          >
            <MessageSquare size={14} color={Colors.light.secondary} />
            <Text style={styles.trendingComments}>{post.commentsCount} comments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function HomeScreenContent() {
  const { user } = useAuth();
  const { isAdmin, unreadCount } = useAdmin();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showComposer, setShowComposer] = useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const utils = trpc.useUtils();


  // Load restaurants first (priority data)
  // eslint-disable-next-line @rork/linters/rsp-react-query-object-api-only
  const restaurantsQuery = trpc.restaurants.list.useQuery(undefined, { 
    staleTime: 1000 * 60 * 30, // Increased to 30 minutes for better caching
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
  });
  const { data: restaurantsData, isLoading: isLoadingRestaurants, error: restaurantsError } = restaurantsQuery;

  // Fallback to Yaoundé restaurants if main list fails
  const yaoundeQuery = trpc.restaurants.yaounde.useQuery({ 
    page: 1 
  }, { 
    staleTime: 1000 * 60 * 30, // Increased to 30 minutes for better caching
    enabled: !restaurantsData?.restaurants?.length && !isLoadingRestaurants && !!restaurantsError,
    retry: 0,
  });
  const { data: yaoundeData, isLoading: isLoadingYaounde } = yaoundeQuery;

  // Load posts using infinite query for better performance
  const shouldLoadPosts = !isLoadingRestaurants && !isLoadingYaounde;
  
  const {
    data: postsData,
    error: postsError,
    isLoading: isLoadingPosts,
    fetchNextPage: fetchNextPostsPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = trpc.posts.feed.useInfiniteQuery(
    { type: 'recent', limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      staleTime: 1000 * 60 * 20,
      enabled: shouldLoadPosts,
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Defer dishes and users data (load after 2 seconds)
  const [shouldLoadDeferred, setShouldLoadDeferred] = useState<boolean>(false);
  const deferredTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (shouldLoadPosts && !shouldLoadDeferred && !deferredTimerRef.current) {
      deferredTimerRef.current = setTimeout(() => {
        setShouldLoadDeferred(true);
      }, 2000);
    }
    
    return () => {
      if (deferredTimerRef.current) {
        clearTimeout(deferredTimerRef.current);
        deferredTimerRef.current = null;
      }
    };
  }, [shouldLoadPosts, shouldLoadDeferred]); // Add shouldLoadDeferred to dependencies

  // eslint-disable-next-line @rork/linters/rsp-react-query-object-api-only
  const dishesQuery = trpc.dishes.list.useQuery(undefined, { 
    staleTime: 1000 * 60 * 45, // Increased to 45 minutes for deferred data
    enabled: shouldLoadDeferred,
    retry: 0,
  });
  const { data: dishesData, error: dishesError } = dishesQuery;

  // eslint-disable-next-line @rork/linters/rsp-react-query-object-api-only
  const usersQuery = trpc.users.list.useQuery(undefined, { 
    staleTime: 1000 * 60 * 45, // Increased to 45 minutes for deferred data
    enabled: shouldLoadDeferred,
    retry: 0,
  });
  const { data: usersData, error: usersError } = usersQuery;

  const featuredRestaurants = useMemo(() => {
    // Try main restaurants list first, then fallback to Yaoundé
    const mainList = restaurantsData?.restaurants ?? [];
    const fallbackList = yaoundeData?.restaurants ?? [];
    const list = mainList.length > 0 ? mainList : fallbackList;
    return list.slice(0, 3);
  }, [restaurantsData?.restaurants, yaoundeData?.restaurants]);
  
  const trendingPosts = useMemo(() => {
    if (!postsData?.pages?.length) return [] as Post[];
    const allPosts = postsData.pages.flatMap(page => page.posts || []);
    return allPosts.slice(0, 2) as Post[];
  }, [postsData?.pages]);


  
  const trendingDishes = useMemo(() => {
    const list = dishesData?.dishes ?? [];
    return list.slice(0, 10) as Dish[];
  }, [dishesData?.dishes]);

  const topFoodies = useMemo(() => {
    const list = usersData?.users ?? [];
    return list.slice(0, 10) as User[];
  }, [usersData?.users]);

  const followUser = trpc.users.follow.useMutation();

  const onToggleFollow = useCallback(async (userId: string) => {
    try {
      const res = await followUser.mutateAsync({ targetUserId: userId });
      console.log('[Home] toggled follow', userId, res);
    } catch (e) {
      console.log('[Home] follow error', e);
    }
  }, [followUser]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('Restaurant pressed:', restaurantId);
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);

  const handleDishPress = useCallback((dishId: string) => {
    console.log('Dish pressed:', dishId);
  }, []);

  const handlePostPress = useCallback((postId: string) => {
    console.log('Post pressed:', postId);
    router.push(`/posts/${postId}` as const);
  }, [router]);

  const likeMutation = trpc.posts.like.useMutation({
    onMutate: async ({ postId }: { postId: string }) => {
      try {
        // Cancel outgoing refetches
        await utils.posts.feed.cancel({ type: 'recent', limit: 10 });
        
        // Snapshot the previous value
        const previousData = utils.posts.feed.getInfiniteData({ type: 'recent', limit: 10 });
        
        // Optimistically update
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
      } catch (error) {
        console.error('[Home] like mutation error:', error);
        return { previousData: null };
      }
    },
    onError: (error: any, variables: any, context: any) => {
      console.error('[Home] like error:', error?.message || 'Unknown error occurred');
      // Rollback on error
      if (context?.previousData) {
        utils.posts.feed.setInfiniteData({ type: 'recent', limit: 10 }, context.previousData);
      }
    },
    onSettled: () => {
      // Use Promise.allSettled to prevent unhandled promise rejections
      Promise.allSettled([
        utils.posts.feed.invalidate({ type: 'recent', limit: 10 })
      ]).catch(console.error);
    }
  });

  const handlePostLike = useCallback(async (postId: string) => {
    if (likeMutation.isPending) return;
    
    try {
      await likeMutation.mutateAsync({ postId });
      console.log('[Home] like toggled', postId);
    } catch (e) {
      console.error('[Home] like error', e);
    }
  }, [likeMutation]);

  const handlePostComments = useCallback((postId: string) => {
    router.push(`/comments/${postId}` as const);
  }, [router]);

  const handleUserPress = useCallback((userId: string) => {
    console.log('User pressed:', userId);
  }, []);

  const handleFilterPress = useCallback(() => {
    console.log('Filter pressed');
  }, []);

  const handleSeeAllRestaurants = useCallback(() => {
    router.push('/restaurants' as const);
  }, [router]);

  const handleSeeAllFeed = useCallback(() => {
    console.log('See all feed pressed');
    router.push('/posts/feed' as const);
  }, [router]);

  const handleRefreshFeed = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        restaurantsQuery.refetch(),
        refetchPosts()
      ]);
      
      const failedResults = results.filter(result => result.status === 'rejected');
      if (failedResults.length > 0) {
        console.warn('[Home] Some refresh operations failed:', failedResults);
      } else {
        console.log('[Home] Feed refreshed successfully');
      }
    } catch (error) {
      console.error('[Home] Failed to refresh feed:', error);
    }
  }, [restaurantsQuery, refetchPosts]);

  const handleLoadMorePosts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      try {
        await fetchNextPostsPage();
        console.log('[Home] Loaded more posts');
      } catch (error) {
        console.error('[Home] Failed to load more posts:', error);
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPostsPage]);



  const handleSeeAllSearch = useCallback(() => {
    console.log('See all search pressed');
  }, []);



  // Only show loading for critical data
  if (isLoadingRestaurants && isLoadingYaounde) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner text="Loading restaurants..." showGradient />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top }]}> 
      {(restaurantsError || postsError || dishesError || usersError) ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {restaurantsError ? 'Failed to load restaurants. ' : ''}
            {postsError ? 'Failed to load posts. ' : ''}
            {dishesError ? 'Failed to load dishes. ' : ''}
            {usersError ? 'Failed to load users.' : ''}
          </Text>
        </View>
      ) : null}
      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.primary} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>Good evening, {user?.displayName || 'User'}!</Text>
                <Text style={styles.title}>What are you craving?</Text>
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => router.push('/admin')} style={styles.adminButton}>
                  <Shield size={20} color="white" />
                  <Text style={styles.adminButtonText}>Admin</Text>
                  {unreadCount > 0 && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={handleFilterPress}
        />

        {/* Create Post/Status Entry */}
        <TouchableOpacity
          testID="open-composer"
          onPress={() => setShowComposer(true)}
          activeOpacity={0.9}
          style={styles.createPostCard}
        >
          <View style={styles.createPostRow}>
            <View style={styles.createPostAvatar} />
            <Text style={styles.createPostPlaceholder}>Share a review, photo, status…</Text>
          </View>
          <View style={styles.createPostActions}>
            <View style={styles.createActionChip}>
              <Plus size={16} color={Colors.light.tint} />
              <Text style={styles.createActionText}>Create Post</Text>
            </View>
            <TouchableOpacity
              testID="open-status"
              onPress={() => router.push('/status' as const)}
              style={[styles.createActionChip, { marginLeft: 8 }]}
            >
              <Plus size={16} color={Colors.light.success} />
              <Text style={[styles.createActionText, { color: Colors.light.success }]}>Post Status</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Flame size={24} color={Colors.light.tint} />
            <Text style={styles.statNumber}>2.4K</Text>
            <Text style={styles.statLabel}>Hot Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={24} color={Colors.light.success} />
            <Text style={styles.statNumber}>15K</Text>
            <Text style={styles.statLabel}>Foodies</Text>
          </View>
          <View style={styles.statCard}>
            <MapPin size={24} color={Colors.light.warning} />
            <Text style={styles.statNumber}>850</Text>
            <Text style={styles.statLabel}>Restaurants</Text>
          </View>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Restaurants</Text>
            <TouchableOpacity onPress={handleSeeAllRestaurants}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {featuredRestaurants.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No restaurants available</Text>
              <Text style={styles.emptySectionSubtext}>
                {isLoadingRestaurants || isLoadingYaounde ? 'Loading...' : 'Try refreshing the app'}
              </Text>
            </View>
          ) : (
            featuredRestaurants.map((restaurant: Restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => handleRestaurantPress(restaurant.id)}
              />
            ))
          )}
        </View>

        {/* Trending Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Posts</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity onPress={handleRefreshFeed} style={styles.refreshButton}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSeeAllFeed}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoadingPosts ? (
            <View style={styles.loadingSection}>
              <Text style={styles.loadingSectionText}>Loading posts...</Text>
            </View>
          ) : postsError ? (
            <View style={styles.errorSection}>
              <Text style={styles.errorSectionText}>Failed to load posts</Text>
              <TouchableOpacity onPress={handleRefreshFeed} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : trendingPosts.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No trending posts</Text>
              <Text style={styles.emptySectionSubtext}>Be the first to share your food experience!</Text>
              <TouchableOpacity onPress={() => setShowComposer(true)} style={styles.createFirstPostButton}>
                <Text style={styles.createFirstPostButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {trendingPosts.map((post) => (
                <TrendingPost
                  key={post.id}
                  post={post}
                  onPress={() => handlePostPress(post.id)}
                  onLike={handlePostLike}
                  onComments={handlePostComments}
                />
              ))}
              {hasNextPage && (
                <TouchableOpacity 
                  onPress={handleLoadMorePosts} 
                  style={styles.loadMoreButton}
                  disabled={isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {isFetchingNextPage ? 'Loading...' : 'Load More Posts'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Top Foodies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Foodies</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {usersQuery.isLoading ? (
            <View style={styles.loadingSection}>
              <Text style={styles.loadingSectionText}>Loading foodies...</Text>
            </View>
          ) : topFoodies.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No top foodies</Text>
              <Text style={styles.emptySectionSubtext}>Start following food enthusiasts!</Text>
            </View>
          ) : (
            <FlatList
              data={topFoodies}
              renderItem={({ item }) => (
                <View style={styles.foodieCard}>
                  <TouchableOpacity onPress={() => handleUserPress(item.id)} activeOpacity={0.9}>
                    <Image source={{ uri: item.avatar }} style={styles.foodieAvatar} />
                  </TouchableOpacity>
                  <Text style={styles.foodieName}>{item.displayName}</Text>
                  <Text style={styles.foodieStats}>{item.followersCount.toLocaleString()} followers</Text>
                  <View style={styles.foodieBadges}>
                    {item.badges.slice(0, 1).map((badge: string) => (
                      <View key={`${item.id}-${badge}`} style={styles.foodieBadge}>
                        <Award size={10} color={Colors.light.warning} />
                        <Text style={styles.foodieBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    testID={`follow-user-${item.id}`}
                    onPress={() => onToggleFollow(item.id)}
                    style={styles.followChip}
                    activeOpacity={0.9}
                  >
                    <UserPlus size={14} color={Colors.light.tint} />
                    <Text style={styles.followChipText}>Follow</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.foodieList}
            />
          )}
        </View>

        {/* Trending Dishes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Dishes</Text>
            <TouchableOpacity onPress={handleSeeAllSearch}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {dishesQuery.isLoading ? (
            <View style={styles.loadingSection}>
              <Text style={styles.loadingSectionText}>Loading dishes...</Text>
            </View>
          ) : trendingDishes.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No trending dishes</Text>
              <Text style={styles.emptySectionSubtext}>Discover amazing dishes from local restaurants!</Text>
            </View>
          ) : (
            <FlatList
              data={trendingDishes}
              renderItem={({ item }) => (
                <DishCard
                  dish={item}
                  onPress={() => handleDishPress(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dishList}
            />
          )}
        </View>


        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

        <Modal visible={showComposer} animationType="slide" presentationStyle="pageSheet">
          <PostComposer onClose={() => setShowComposer(false)} />
        </Modal>
        
        <PerformanceMonitor enabled={__DEV__ || isAdmin} />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  adminBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  dishList: {
    paddingHorizontal: 16,
  },
  trendingPost: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  trendingContent: {
    padding: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  trendingUserInfo: {
    flex: 1,
  },
  trendingUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trendingRestaurant: {
    fontSize: 12,
    color: Colors.light.tint,
  },
  trendingText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  trendingStats: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  trendingStatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingLikes: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  trendingComments: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  foodieList: {
    paddingHorizontal: 16,
  },
  foodieCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodieAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  foodieName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  foodieStats: {
    fontSize: 12,
    color: Colors.light.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  foodieBadges: {
    alignItems: 'center',
  },
  foodieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  foodieBadgeText: {
    fontSize: 10,
    color: Colors.light.warning,
    marginLeft: 2,
    fontWeight: '500',
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  followChipText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
  createPostCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  createPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.border,
    marginRight: 10,
  },
  createPostPlaceholder: {
    flex: 1,
    color: Colors.light.secondary,
    fontSize: 14,
  },
  createPostActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  createActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  createActionText: {
    marginLeft: 6,
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '700',
  },
  closeComposerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  errorBox: {
    padding: 16,
  },
  errorText: {
    color: Colors.light.secondary,
  },
  emptySection: {
    paddingHorizontal: 16,
  },
  emptySectionText: {
    color: Colors.light.secondary,
  },
  emptySectionSubtext: {
    color: Colors.light.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  loadingSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingSectionText: {
    color: Colors.light.secondary,
    fontSize: 14,
  },
  errorSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorSectionText: {
    color: Colors.light.error,
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  createFirstPostButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  createFirstPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreButton: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  loadMoreText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function HomeScreen() {
  return (
    <ErrorBoundary>
      <HomeScreenContent />
    </ErrorBoundary>
  );
}