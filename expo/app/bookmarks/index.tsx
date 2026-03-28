import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Heart, MapPin, Star, Trash2 } from 'lucide-react-native';

import { useSettings } from '@/providers/SettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { trpc } from '@/lib/trpc';
import { Bookmark as BookmarkType, Restaurant, Dish, Post } from '@/types/restaurant';

interface BookmarkItemProps {
  bookmark: BookmarkType;
  onPress: () => void;
  onRemove: (id: string) => void;
}

const BookmarkItem = React.memo(function BookmarkItem({ bookmark, onPress, onRemove }: BookmarkItemProps) {
  const { colors } = useSettings();
  
  const renderContent = () => {
    switch (bookmark.type) {
      case 'restaurant':
        const restaurant = bookmark.item as Restaurant;
        return (
          <View style={[styles.bookmarkCard, { backgroundColor: colors.card }]}>
            <Image source={{ uri: restaurant.image }} style={styles.bookmarkImage} />
            <View style={styles.bookmarkContent}>
              <View style={styles.bookmarkHeader}>
                <Text style={[styles.bookmarkTitle, { color: colors.text }]}>{restaurant.name}</Text>
                <TouchableOpacity
                  onPress={() => onRemove(bookmark.id)}
                  style={styles.removeButton}
                  testID={`remove-bookmark-${bookmark.id}`}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.bookmarkSubtitle, { color: colors.secondary }]}>{restaurant.cuisine}</Text>
              <View style={styles.bookmarkMeta}>
                <View style={styles.ratingContainer}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={[styles.rating, { color: colors.text }]}>{restaurant.rating}</Text>
                  <Text style={[styles.reviewCount, { color: colors.secondary }]}>({restaurant.reviewCount})</Text>
                </View>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color={colors.secondary} />
                  <Text style={[styles.location, { color: colors.secondary }]}>{restaurant.address}</Text>
                </View>
              </View>
              <View style={styles.tagsContainer}>
                {restaurant.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.tagText, { color: colors.tint }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
        
      case 'dish':
        const dish = bookmark.item as Dish;
        return (
          <View style={[styles.bookmarkCard, { backgroundColor: colors.card }]}>
            <Image source={{ uri: dish.image }} style={styles.bookmarkImage} />
            <View style={styles.bookmarkContent}>
              <View style={styles.bookmarkHeader}>
                <Text style={[styles.bookmarkTitle, { color: colors.text }]}>{dish.name}</Text>
                <TouchableOpacity
                  onPress={() => onRemove(bookmark.id)}
                  style={styles.removeButton}
                  testID={`remove-bookmark-${bookmark.id}`}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.bookmarkSubtitle, { color: colors.secondary }]}>{dish.restaurant}</Text>
              <Text style={[styles.dishPrice, { color: colors.tint }]}>{dish.price.toLocaleString()} FCFA</Text>
              <View style={styles.bookmarkMeta}>
                <View style={styles.ratingContainer}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={[styles.rating, { color: colors.text }]}>{dish.rating}</Text>
                  <Text style={[styles.reviewCount, { color: colors.secondary }]}>({dish.reviewCount})</Text>
                </View>
              </View>
              <Text style={[styles.dishDescription, { color: colors.secondary }]} numberOfLines={2}>
                {dish.description}
              </Text>
            </View>
          </View>
        );
        
      case 'post':
        const post = bookmark.item as Post;
        return (
          <View style={[styles.bookmarkCard, { backgroundColor: colors.card }]}>
            {post.content.images?.[0] && (
              <Image source={{ uri: post.content.images[0] }} style={styles.bookmarkImage} />
            )}
            <View style={styles.bookmarkContent}>
              <View style={styles.bookmarkHeader}>
                <View style={styles.postUserInfo}>
                  <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
                  <Text style={[styles.bookmarkTitle, { color: colors.text }]}>{post.user.displayName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRemove(bookmark.id)}
                  style={styles.removeButton}
                  testID={`remove-bookmark-${bookmark.id}`}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              {post.restaurant && (
                <Text style={[styles.bookmarkSubtitle, { color: colors.tint }]}>{post.restaurant.name}</Text>
              )}
              <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
                {post.content.text}
              </Text>
              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Heart size={14} color={colors.secondary} />
                  <Text style={[styles.statText, { color: colors.secondary }]}>{post.likesCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statText, { color: colors.secondary }]}>{post.commentsCount} comments</Text>
                </View>
              </View>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      {renderContent()}
    </TouchableOpacity>
  );
});

export default function BookmarksScreen() {
  const { colors } = useSettings();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'restaurant' | 'dish' | 'post'>('all');
  
  // Fetch bookmarks from server
  const bookmarksQuery = trpc.bookmarks.list.useQuery({
    staleTime: 1000 * 60 * 5
  });
  
  // Remove bookmark mutation
  const removeBookmarkMutation = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      bookmarksQuery.refetch();
    },
  });
  
  const bookmarks = bookmarksQuery.data?.bookmarks ?? [];
  const isLoading = bookmarksQuery.isLoading;
  
  const filteredBookmarks = bookmarks.filter(bookmark => 
    selectedFilter === 'all' || bookmark.type === selectedFilter
  );
  
  const handleBookmarkPress = useCallback((bookmark: BookmarkType) => {
    switch (bookmark.type) {
      case 'restaurant':
        router.push(`/restaurants/${bookmark.itemId}`);
        break;
      case 'dish':
        router.push(`/(tabs)/(search)/search?dish=${bookmark.itemId}`);
        break;
      case 'post':
        router.push(`/posts/${bookmark.itemId}`);
        break;
    }
  }, [router]);
  
  const handleRemoveBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await removeBookmarkMutation.mutateAsync({ bookmarkId });
      console.log('[Bookmarks] Removed bookmark:', bookmarkId);
    } catch (error) {
      console.error('[Bookmarks] Failed to remove bookmark:', error);
    }
  }, [removeBookmarkMutation]);
  
  const filterButtons = [
    { key: 'all' as const, label: 'All', count: bookmarks.length },
    { key: 'restaurant' as const, label: 'Restaurants', count: bookmarks.filter(b => b.type === 'restaurant').length },
    { key: 'dish' as const, label: 'Dishes', count: bookmarks.filter(b => b.type === 'dish').length },
    { key: 'post' as const, label: 'Posts', count: bookmarks.filter(b => b.type === 'post').length },
  ];
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Loading bookmarks..." />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'My Bookmarks',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
              testID={`filter-${filter.key}`}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedFilter === filter.key ? 'white' : colors.text,
                  },
                ]}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.3)' : colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      {
                        color: selectedFilter === filter.key ? 'white' : colors.tint,
                      },
                    ]}
                  >
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bookmark size={64} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookmarks yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            {selectedFilter === 'all' 
              ? 'Start bookmarking restaurants, dishes, and posts you love!'
              : `No ${selectedFilter}s bookmarked yet`
            }
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(search)/search')}
            style={[styles.exploreButton, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.exploreButtonText}>Explore Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookmarks}
          renderItem={({ item }) => (
            <BookmarkItem
              bookmark={item}
              onPress={() => handleBookmarkPress(item)}
              onRemove={handleRemoveBookmark}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  bookmarkCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookmarkTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  bookmarkSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  bookmarkMeta: {
    marginBottom: 12,
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  dishDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});