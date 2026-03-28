import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Star, Phone, MapPin, Clock, Heart, Share, ArrowLeft, UserPlus, Trash2 } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Restaurant } from '@/types/restaurant';
import RestaurantProfileAudit from '@/components/RestaurantProfileAudit';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [bookmarking, setBookmarking] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);

  const restaurantQuery = trpc.restaurantsMain.getById.useQuery(
    { id: String(id) },
    { enabled: !!id, staleTime: 1000 * 60 * 5 }
  );

  const restaurant = useMemo<Restaurant | undefined>(() => {
    const r: any = restaurantQuery.data;
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name ?? 'Unknown',
      cuisine: r.cuisine ?? 'Various',
      rating: Number(r.rating ?? 0),
      reviewCount: Number(r.reviewCount ?? 0),
      image: r.image_url ?? 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200',
      address: r.address ?? '—',
      priceRange: (r.price_range as Restaurant['priceRange']) ?? '$',
      distance: undefined,
      isOpen: true,
      tags: [],
      verified: false,
      claimed: false,
      followersCount: Number(r.followersCount ?? 0),
    };
  }, [restaurantQuery.data]);

  const reviewsQuery = trpc.reviews.getByRestaurant.useQuery(
    { restaurantId: String(id) },
    { enabled: !!id && activeTab === 'reviews', staleTime: 30000 }
  );

  const followMutation = trpc.restaurants.follow.useMutation();
  const bookmarkMutation = trpc.bookmarks.toggleRestaurant.useMutation();
  const createReview = trpc.reviews.create.useMutation();
  const deleteReview = trpc.reviews.delete.useMutation();
  const utils = trpc.useUtils();

  const toggleFollow = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      const res = await followMutation.mutateAsync({ restaurantId: restaurant.id });
      setFollowing(res.following);
      setFollowersCount(res.followersCount);
    } catch (e) {
      console.log('[RestaurantDetail] follow error', e);
    }
  }, [followMutation, restaurant?.id]);

  const toggleBookmark = useCallback(async () => {
    if (!restaurant?.id || bookmarking) return;
    setBookmarking(true);
    setIsBookmarked((prev) => !prev);
    try {
      await bookmarkMutation.mutateAsync({ restaurantId: restaurant.id });
    } catch (e) {
      console.log('[RestaurantDetail] bookmark error', e);
      setIsBookmarked((prev) => !prev);
    } finally {
      setBookmarking(false);
    }
  }, [bookmarkMutation, restaurant?.id, bookmarking]);

  const [newReview, setNewReview] = useState<string>('');
  const [newRating] = useState<number>(5);

  const submitReview = useCallback(async () => {
    const text = newReview.trim();
    if (!text || !restaurant?.id) return;
    try {
      await createReview.mutateAsync({ restaurantId: restaurant.id, text, rating: newRating });
      setNewReview('');
      utils.reviews.getByRestaurant.invalidate({ restaurantId: restaurant.id }).catch(() => {});
    } catch (e) {
      console.log('[RestaurantDetail] create review error', e);
    }
  }, [createReview, newReview, newRating, restaurant?.id, utils.reviews.getByRestaurant]);

  const handleDeleteReview = useCallback(async (reviewId: string) => {
    if (!reviewId || !restaurant?.id) return;
    try {
      await deleteReview.mutateAsync({ id: reviewId });
      utils.reviews.getByRestaurant.invalidate({ restaurantId: restaurant.id }).catch(() => {});
    } catch (e) {
      console.log('[RestaurantDetail] delete review error', e);
    }
  }, [deleteReview, restaurant?.id, utils.reviews.getByRestaurant]);

  if (restaurantQuery.isLoading) {
    return <LoadingSpinner text="Loading restaurant..." />;
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <Text style={styles.error}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="restaurant-detail">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.cover} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleBookmark}>
              <Heart size={20} color={isBookmarked ? Colors.light.error : 'white'} fill={isBookmarked ? Colors.light.error : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.meta}>{restaurant.cuisine} • {restaurant.priceRange}</Text>
            </View>
            <TouchableOpacity testID="restaurant-follow" style={[styles.followBtn, following ? styles.following : null]} onPress={toggleFollow}>
              {following ? (
                <Text style={styles.followText}>Following • {followersCount || restaurant.followersCount || 0}</Text>
              ) : (
                <View style={styles.followInner}>
                  <UserPlus size={14} color={Colors.light.tint} />
                  <Text style={styles.followTextTint}>Follow • {followersCount || restaurant.followersCount || 0}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={16} color={i < Math.round(restaurant.rating) ? Colors.light.warning : Colors.light.border} fill={i < Math.round(restaurant.rating) ? Colors.light.warning : 'transparent'} />
            ))}
            <Text style={styles.ratingText}>{restaurant.rating} ({restaurant.reviewCount} reviews)</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <MapPin size={16} color={Colors.light.secondary} />
              <Text style={styles.contactText}>{restaurant.address}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={16} color={Colors.light.secondary} />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
            <View style={styles.contactItem}>
              <Clock size={16} color={Colors.light.secondary} />
              <Text style={styles.contactText}>Open until 10:00 PM</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {restaurant.tags.map((tag, index) => (
              <View key={`${restaurant.id}-${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <RestaurantProfileAudit restaurant={restaurant} />

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'menu' ? (
          <View style={styles.menuContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Menu not available</Text>
            </View>
          </View>
        ) : (
          <View style={styles.reviewsContainer}>
            {reviewsQuery.isLoading ? (
              <LoadingSpinner text="Loading reviews..." />
            ) : (Array.isArray(reviewsQuery.data) && reviewsQuery.data.length > 0) ? (
              reviewsQuery.data.map((rev: any) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: rev.user?.avatar || 'https://images.unsplash.com/photo-1544435253-f0ead49638b9?w=200&h=200&fit=crop' }} style={styles.reviewAvatar} />
                    <View style={styles.reviewUserInfo}>
                      <Text style={styles.reviewUsername}>{rev.user?.displayName || 'User'}</Text>
                      <View style={styles.reviewRating}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={12} color={i < (Number(rev.rating) || 0) ? Colors.light.warning : Colors.light.border} fill={i < (Number(rev.rating) || 0) ? Colors.light.warning : 'transparent'} />
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteReview(rev.id)}>
                      <Trash2 size={16} color={Colors.light.secondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reviewText}>{rev.text}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No reviews yet</Text>
              </View>
            )}

            <View style={{ paddingVertical: 12 }}>
              <TextInput
                placeholder="Write a review..."
                placeholderTextColor={Colors.light.secondary}
                value={newReview}
                onChangeText={setNewReview}
                style={{ borderWidth: 1, borderColor: Colors.light.border, borderRadius: 8, padding: 12, color: Colors.light.text }}
              />
              <View style={{ height: 10 }} />
              <TouchableOpacity onPress={submitReview} style={{ backgroundColor: Colors.light.tint, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  imageContainer: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.light.border,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleLeft: {
    flex: 1,
  },
  followBtn: {
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  following: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.tint,
  },
  followInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: '700',
  },
  followTextTint: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 16,
    color: Colors.light.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  contactInfo: {
    marginTop: 16,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  menuContainer: {
    padding: 16,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reviewRating: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  bottomSpacing: {
    height: 32,
  },
  error: {
    padding: 24,
    color: Colors.light.secondary,
  },
});