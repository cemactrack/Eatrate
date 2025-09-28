import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Star, Phone, MapPin, Clock, Heart, Share, ArrowLeft, UserPlus } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Restaurant } from '@/types/restaurant';
import RestaurantProfileAudit from '@/components/RestaurantProfileAudit';


export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  const douala = trpc.restaurants.douala.useQuery({}, { staleTime: 1000 * 60 * 10 });
  const yaounde = trpc.restaurants.yaounde.useQuery({ page: 1 }, { staleTime: 1000 * 60 * 10 });
  const buea = trpc.restaurants.buea.useQuery({}, { staleTime: 1000 * 60 * 10 });
  const limbe = trpc.restaurants.limbe.useQuery({}, { staleTime: 1000 * 60 * 10 });
  const generic = trpc.restaurants.list.useQuery(undefined, { staleTime: 1000 * 60 * 10 });

  const isLoading = (douala.isLoading || yaounde.isLoading || buea.isLoading || limbe.isLoading) && !generic.data;

  const restaurant = useMemo<Restaurant | undefined>(() => {
    const pools: Array<Restaurant[]> = [
      douala.data?.restaurants ?? [],
      yaounde.data?.restaurants ?? [],
      buea.data?.restaurants ?? [],
      limbe.data?.restaurants ?? [],
      generic.data?.restaurants ?? [],
    ];
    for (const list of pools) {
      const found = list.find((r) => r.id === id);
      if (found) return found;
    }
    return undefined;
  }, [buea.data?.restaurants, douala.data?.restaurants, generic.data?.restaurants, id, limbe.data?.restaurants, yaounde.data?.restaurants]);

  const [following, setFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(restaurant?.followersCount ?? 0);
  const followMutation = trpc.restaurants.follow.useMutation();

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

  const menu = useMemo(() => [], [restaurant]);
  const reviews = useMemo(() => [], [restaurant]);

  if (isLoading) {
    return <LoadingSpinner text="Loading restaurant..." />;
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.error}>Restaurant not found</Text>
      </View>
    );
  }

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUsername}>{item.user.displayName}</Text>
          <View style={styles.reviewRating}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={12}
                color={i < (item.ratings?.food || 0) ? Colors.light.warning : Colors.light.border}
                fill={i < (item.ratings?.food || 0) ? Colors.light.warning : 'transparent'}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewText} numberOfLines={3}>{item.content.text}</Text>
      {item.content.images && item.content.images.length > 0 && (
        <Image source={{ uri: item.content.images[0] }} style={styles.reviewImage} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="restaurant-detail">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.cover} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Heart size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.meta}>{restaurant.cuisine} • {restaurant.priceRange}</Text>
            </View>
            <TouchableOpacity testID="restaurant-follow" style={[styles.followBtn, following ? styles.following : null]} onPress={toggleFollow}>
              {following ? (
                <Text style={styles.followText}>Following • {followersCount}</Text>
              ) : (
                <View style={styles.followInner}>
                  <UserPlus size={14} color={Colors.light.tint} />
                  <Text style={styles.followTextTint}>Follow • {followersCount}</Text>
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
          
          {/* Contact Info */}
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

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {restaurant.tags.map((tag, index) => (
              <View key={`${restaurant.id}-${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <RestaurantProfileAudit restaurant={restaurant} />

        {/* Tabs */}
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

        {/* Content */}
        {activeTab === 'menu' ? (
          <View style={styles.menuContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Menu not available</Text>
            </View>
          </View>
        ) : (
          <View style={styles.reviewsContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No reviews yet</Text>
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.light.border,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  menuDesc: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  menuPrice: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.tint,
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
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
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