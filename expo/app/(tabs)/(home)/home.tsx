import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Award, MapPin, Users, Flame, Plus, UserPlus, Heart, MessageSquare, Shield, UtensilsCrossed, Coffee, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import LoadingSpinner from '@/components/LoadingSpinner';
import { RestaurantCardSkeleton, PostCardSkeleton, UserCardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useError } from '@/providers/ErrorProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Restaurant, Post } from '@/types/restaurant';
import OptimizedRestaurantCard from '@/components/OptimizedRestaurantCard';
import DishCard from '@/components/DishCard';
import SearchBar from '@/components/SearchBar';
import { gradients } from '@/constants/colors';
import PostComposer from '@/components/PostComposer';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { useAuth } from '@/providers/AuthProvider';
import { useAdmin } from '@/providers/AdminProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { 
  useFeaturedRestaurants, 
  useTrendingPosts, 
  useTrendingDishes, 
  useTopFoodies,
  useOptimisticLike,
  useOptimisticFollow
} from '@/hooks/useQueries';

import { formatNumber } from '@/utils/helpers';

interface TrendingPostProps {
  post: Post;
  onPress: () => void;
  onLike: (postId: string) => void;
  onComments: (postId: string) => void;
}

const TrendingPost = React.memo(function TrendingPost({ post, onPress, onLike, onComments }: TrendingPostProps) {
  const { colors } = useSettings();
  
  // Add safety checks for post data
  if (!post || !post.user) {
    console.warn('[TrendingPost] Invalid post data:', post);
    return null;
  }
  
  const defaultAvatar = 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop';
  const userAvatar = post.user?.avatar || defaultAvatar;
  const userName = post.user?.displayName || 'Unknown User';
  const postText = post.content?.text || 'No content available';
  const likesCount = post.likesCount || 0;
  const commentsCount = post.commentsCount || 0;
  
  return (
    <TouchableOpacity style={[styles.trendingPost, { backgroundColor: colors.card }]} onPress={onPress}>
      <Image
        source={{ uri: post.content?.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' }}
        style={styles.trendingImage}
        resizeMode="cover"
      />
      <View style={styles.trendingContent}>
        <View style={styles.trendingHeader}>
          <Image 
            source={{ uri: userAvatar }} 
            style={styles.trendingAvatar}
            defaultSource={{ uri: defaultAvatar }}
          />
          <View style={styles.trendingUserInfo}>
            <Text style={[styles.trendingUsername, { color: colors.text }]}>{userName}</Text>
            {post.restaurant?.name && (
              <Text style={[styles.trendingRestaurant, { color: colors.tint }]}>{post.restaurant.name}</Text>
            )}
          </View>
        </View>
        <Text style={[styles.trendingText, { color: colors.text }]} numberOfLines={2}>
          {postText}
        </Text>
        <View style={styles.trendingStats}>
          <TouchableOpacity
            testID={`post-like-${post.id}`}
            style={styles.trendingStatBtn}
            onPress={() => onLike(post.id)}
            activeOpacity={0.8}
          >
            <Heart size={14} color={colors.tint} />
            <Text style={[styles.trendingLikes, { color: colors.secondary }]}>{likesCount} likes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`post-comments-${post.id}`}
            style={styles.trendingStatBtn}
            onPress={() => onComments(post.id)}
            activeOpacity={0.8}
          >
            <MessageSquare size={14} color={colors.secondary} />
            <Text style={[styles.trendingComments, { color: colors.secondary }]}>{commentsCount} comments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function HomeScreenContent() {
  const { user } = useAuth();
  const { isAdmin, unreadCount } = useAdmin();
  const { colors } = useSettings();
  const { showError } = useError();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showComposer, setShowComposer] = useState<boolean>(false);

  const insets = useSafeAreaInsets();

  // Use optimized hooks
  const { restaurants: featuredRestaurants, isLoading: isLoadingRestaurants, error: restaurantsError } = useFeaturedRestaurants(3);
  const { posts: trendingPosts, isLoading: isLoadingPosts, error: postsError, refetch: refetchPosts } = useTrendingPosts(2);
  
  // Defer loading of dishes and users
  const [shouldLoadDeferred, setShouldLoadDeferred] = useState<boolean>(false);
  const deferredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (!isLoadingRestaurants && !isLoadingPosts && !shouldLoadDeferred && !deferredTimerRef.current) {
      deferredTimerRef.current = setTimeout(() => {
        setShouldLoadDeferred(true);
        deferredTimerRef.current = null;
      }, 2000);
    }
    
    return () => {
      if (deferredTimerRef.current) {
        clearTimeout(deferredTimerRef.current);
        deferredTimerRef.current = null;
      }
    };
  }, [isLoadingRestaurants, isLoadingPosts, shouldLoadDeferred]);

  const { dishes: trendingDishes, isLoading: isLoadingDishes, error: dishesError } = useTrendingDishes(10, shouldLoadDeferred);
  const { users: topFoodies, isLoading: isLoadingUsers, error: usersError } = useTopFoodies(10, shouldLoadDeferred);

  // Use optimistic mutations
  const likeMutation = useOptimisticLike();
  const followMutation = useOptimisticFollow();

  const onToggleFollow = useCallback(async (userId: string) => {
    if (followMutation.isPending) return;
    try {
      await followMutation.mutateAsync({ targetUserId: userId });
      console.log('[Home] toggled follow', userId);
    } catch (e) {
      console.log('[Home] follow error', e);
    }
  }, [followMutation]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('Restaurant pressed:', restaurantId);
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);

  const handleDishPress = useCallback((dishId: string) => {
    console.log('Dish pressed:', dishId);
    // Navigate to dish details or search for this dish
    router.push(`/(tabs)/(search)/search?dish=${dishId}`);
  }, [router]);

  const handlePostPress = useCallback((postId: string) => {
    console.log('Post pressed:', postId);
    router.push(`/posts/${postId}`);
  }, [router]);



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
    router.push(`/comments/${postId}`);
  }, [router]);

  const handleUserPress = useCallback((userId: string) => {
    console.log('User pressed:', userId);
    router.push(`/users/${userId}`);
  }, [router]);

  const handleFilterPress = useCallback(() => {
    console.log('Filter pressed');
    router.push('/(tabs)/(search)/search?showFilters=true');
  }, [router]);

  const handleSeeAllRestaurants = useCallback(() => {
    router.push('/restaurants');
  }, [router]);

  const handleSeeAllFeed = useCallback(() => {
    console.log('See all feed pressed');
    router.push('/posts/feed');
  }, [router]);

  const handleRefreshFeed = useCallback(async () => {
    try {
      await refetchPosts();
      console.log('[Home] Feed refreshed successfully');
    } catch (error) {
      console.error('[Home] Failed to refresh feed:', error);
    }
  }, [refetchPosts]);





  const handleSeeAllSearch = useCallback(() => {
    console.log('See all dishes pressed');
    router.push('/(tabs)/(search)/search?category=dishes');
  }, [router]);



  // Show API errors via toast
  React.useEffect(() => {
    if (restaurantsError) {
      showError('Failed to load restaurants. Please try again.', 'error');
    }
    if (postsError) {
      showError('Failed to load posts. Please try again.', 'error');
    }
  }, [restaurantsError, postsError, showError]);

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
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
          placeholder="Search restaurants, dishes, or users..."
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              router.push(`/(tabs)/(search)/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
        />

        {/* Create Post/Status Entry */}
        <TouchableOpacity
          testID="open-composer"
          onPress={() => setShowComposer(true)}
          activeOpacity={0.9}
          style={styles.createPostCard}
        >
          <View style={styles.createPostRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.createPostAvatar} />
            ) : (
              <View style={styles.createPostAvatar} />
            )}
            <Text style={styles.createPostPlaceholder}>Share a review, photo, status…</Text>
          </View>
          <View style={styles.createPostActions}>
            <View style={styles.createActionChip}>
              <Plus size={16} color={'#FF6B35'} />
              <Text style={styles.createActionText}>Create Post</Text>
            </View>
            <TouchableOpacity
              testID="open-status"
              onPress={() => router.push('/status')}
              style={[styles.createActionChip, { marginLeft: 8 }]}
            >
              <Plus size={16} color={'#10B981'} />
              <Text style={[styles.createActionText, { color: '#10B981' }]}>Post Status</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Flame size={24} color={'#FF6B35'} />
            <Text style={styles.statNumber}>{formatNumber(trendingPosts.length * 1200)}</Text>
            <Text style={styles.statLabel}>Hot Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={24} color={'#10B981'} />
            <Text style={styles.statNumber}>{formatNumber(topFoodies.length * 1500)}</Text>
            <Text style={styles.statLabel}>Foodies</Text>
          </View>
          <View style={styles.statCard}>
            <MapPin size={24} color={'#F59E0B'} />
            <Text style={styles.statNumber}>{formatNumber(featuredRestaurants.length * 283)}</Text>
            <Text style={styles.statLabel}>Restaurants</Text>
          </View>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Restaurants</Text>
            <TouchableOpacity onPress={handleSeeAllRestaurants}>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingRestaurants ? (
            <>
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
            </>
          ) : featuredRestaurants.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No restaurants yet"
              subtitle="Be the first to discover amazing restaurants in your area!"
              actionText="Explore Restaurants"
              onAction={handleSeeAllRestaurants}
              testId="empty-restaurants"
            />
          ) : (
            featuredRestaurants.map((restaurant: Restaurant) => (
              <OptimizedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                compact={false}
                onPress={() => handleRestaurantPress(restaurant.id)}
              />
            ))
          )}
        </View>

        {/* Trending Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Posts</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity 
                onPress={handleRefreshFeed} 
                style={styles.refreshButton}
                disabled={isLoadingPosts}
              >
                <Text style={[styles.refreshText, { color: colors.secondary }, isLoadingPosts && { opacity: 0.5 }]}>
                  {isLoadingPosts ? 'Loading...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSeeAllFeed}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoadingPosts ? (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          ) : trendingPosts.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="No posts yet"
              subtitle="Be the first to share your food experience!"
              actionText="Create Post"
              onAction={() => setShowComposer(true)}
              testId="empty-posts"
            />
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
            </>
          )}
        </View>

        {/* Top Foodies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Foodies</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/(profile)/profile')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingUsers ? (
            <FlatList
              data={[1, 2, 3]}
              renderItem={() => <UserCardSkeleton />}
              keyExtractor={(item) => item.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.foodieList}
            />
          ) : topFoodies.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No foodies yet"
              subtitle="Start following food enthusiasts to see them here!"
              testId="empty-foodies"
            />
          ) : (
            <FlatList
              data={topFoodies}
              renderItem={({ item }) => {
                if (!item) return null;
                
                const defaultAvatar = 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop';
                const userAvatar = item.avatar || defaultAvatar;
                const displayName = item.displayName || 'Unknown User';
                const followersCount = item.followersCount || 0;
                const badges = item.badges || [];
                
                return (
                  <View style={[styles.foodieCard, { backgroundColor: colors.card }]}>
                    <TouchableOpacity onPress={() => handleUserPress(item.id)} activeOpacity={0.9}>
                      <Image 
                        source={{ uri: userAvatar }} 
                        style={styles.foodieAvatar}
                        defaultSource={{ uri: defaultAvatar }}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.foodieName, { color: colors.text }]}>{displayName}</Text>
                    <Text style={[styles.foodieStats, { color: colors.secondary }]}>{followersCount.toLocaleString()} followers</Text>
                    <View style={styles.foodieBadges}>
                      {badges.slice(0, 1).map((badge: string) => (
                        <View key={`${item.id}-${badge}`} style={[styles.foodieBadge, { backgroundColor: colors.accent }]}>
                          <Award size={10} color={colors.warning} />
                          <Text style={[styles.foodieBadgeText, { color: colors.warning }]}>{badge}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      testID={`follow-user-${item.id}`}
                      onPress={() => onToggleFollow(item.id)}
                      style={[styles.followChip, { backgroundColor: colors.accent, borderColor: colors.border, borderWidth: 1 }]}
                      activeOpacity={0.9}
                    >
                      <UserPlus size={14} color={colors.tint} />
                      <Text style={[styles.followChipText, { color: colors.tint }]}>Follow</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Dishes</Text>
            <TouchableOpacity onPress={handleSeeAllSearch}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {!shouldLoadDeferred ? (
            <FlatList
              data={[1, 2, 3, 4]}
              renderItem={() => (
                <View style={styles.dishSkeleton}>
                  <RestaurantCardSkeleton />
                </View>
              )}
              keyExtractor={(item) => item.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dishList}
            />
          ) : trendingDishes.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No trending dishes"
              subtitle="Discover amazing dishes from local restaurants!"
              actionText="Explore Dishes"
              onAction={handleSeeAllSearch}
              testId="empty-dishes"
            />
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
        <View style={[styles.bottomSpacing]} />
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
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
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  dishList: {
    paddingHorizontal: 16,
  },
  trendingPost: {
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
  },
  trendingRestaurant: {
    fontSize: 12,
  },
  trendingText: {
    fontSize: 14,
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
    fontWeight: '500',
  },
  trendingComments: {
    fontSize: 12,
    fontWeight: '500',
  },
  foodieList: {
    paddingHorizontal: 16,
  },
  foodieCard: {
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
    textAlign: 'center',
    marginBottom: 4,
  },
  foodieStats: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  foodieBadges: {
    alignItems: 'center',
  },
  foodieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  foodieBadgeText: {
    fontSize: 10,
    marginLeft: 2,
    fontWeight: '500',
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  followChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
  createPostCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
    marginRight: 10,
  },
  createPostPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  createPostActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  createActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  createActionText: {
    marginLeft: 6,
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
  },
  emptySection: {
    paddingHorizontal: 16,
  },
  emptySectionText: {
  },
  emptySectionSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingSectionText: {
    fontSize: 14,
  },
  errorSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorSectionText: {
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createFirstPostButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  createFirstPostButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rootBg: {
    flex: 1,
  },
  dishSkeleton: {
    width: 200,
    marginRight: 12,
  },
});

export default function HomeScreen() {
  const { colors } = useSettings();
  return (
    <ErrorBoundary>
      <View style={[styles.rootBg, { backgroundColor: colors.background }]}>
        <HomeScreenContent />
      </View>
    </ErrorBoundary>
  );
}