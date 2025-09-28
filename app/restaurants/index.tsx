import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Restaurant } from '@/types/restaurant';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import * as Haptics from 'expo-haptics';

export default function RestaurantsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const listQuery = trpc.restaurantsMain.list.useQuery(
    { limit: 50, offset: 0 },
    { staleTime: 1000 * 60 * 10 }
  );

  const searchApi = trpc.restaurantsMain.search.useQuery(
    { query: searchQuery.trim() || 'a', limit: 50 },
    { enabled: searchQuery.trim().length > 0, staleTime: 1000 * 60 * 5 }
  );

  const mapItem = useCallback((r: any): Restaurant => ({
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
  }), []);

  const baseList = useMemo<Restaurant[]>(() => {
    const data = listQuery.data ?? [];
    return Array.isArray(data) ? data.map(mapItem) : [];
  }, [listQuery.data, mapItem]);

  const filteredRestaurants = useMemo<Restaurant[]>(() => {
    if (searchQuery.trim().length > 0) {
      const data = searchApi.data ?? [];
      return Array.isArray(data) ? data.map(mapItem) : [];
    }
    return baseList;
  }, [searchApi.data, searchQuery, baseList, mapItem]);
  
  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('[RestaurantsList] open detail', restaurantId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);
  

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="restaurants-list">
      <Stack.Screen options={{ 
        title: 'Restaurants', 
        headerShown: true,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
        )
      }} />
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search restaurants..."
      />
      
      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsInfo}>
          <MapPin size={16} color={Colors.light.tint} />
          <Text style={styles.locationText}>Yaoundé</Text>
        </View>
        <Text style={styles.resultsCount}>
          {(listQuery.isLoading || searchApi.isLoading) ? 'Loading...' : `${filteredRestaurants.length} restaurants`}
        </Text>
      </View>
      {(listQuery.isLoading || searchApi.isLoading) ? (
        <LoadingSpinner text="Loading restaurants..." />
      ) : (listQuery.error || searchApi.error) ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn’t load restaurants</Text>
          <Text style={styles.emptySubtitle}>Please check your connection and try again.</Text>
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No restaurants found</Text>
          <Text style={styles.emptySubtitle}>Try again in a moment.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => handleRestaurantPress(item.id)}
            />
          )}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}

          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No restaurants found' : 'No restaurants available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search terms' : 'Try again in a moment.'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
});