import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { useSettings } from '@/providers/SettingsProvider';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useSettings();

  const restaurantsQuery = trpc.restaurants.douala.useQuery({}, { 
    staleTime: 1000 * 60 * 20,
    retry: 0,
    refetchOnMount: false,
  });
  const { data, isLoading, error } = restaurantsQuery;

  const cuisines = useMemo(() => {
    const set = new Set<string>(['All']);
    (data?.restaurants ?? []).forEach((r: import('@/types/restaurant').Restaurant) => set.add(r.cuisine));
    return Array.from(set);
  }, [data?.restaurants]);

  const filteredRestaurants = useMemo(() => {
    const list: import('@/types/restaurant').Restaurant[] = data?.restaurants ?? [];
    return list.filter((restaurant: import('@/types/restaurant').Restaurant) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = restaurant.name.toLowerCase().includes(query) ||
                           restaurant.cuisine.toLowerCase().includes(query) ||
                           restaurant.tags.some((tag: string) => tag.toLowerCase().includes(query));
      
      const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;
      
      return matchesSearch && matchesCuisine;
    });
  }, [data?.restaurants, searchQuery, selectedCuisine]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('Restaurant pressed:', restaurantId);
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);

  const handleCuisineSelect = useCallback((cuisine: string) => {
    if (cuisine && cuisine.trim() && cuisine.length <= 50) {
      setSelectedCuisine(cuisine.trim());
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]} testID="search-screen">
      <Stack.Screen options={{ title: 'Search', headerShown: false }} />
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search restaurants, cuisines..."
      />

      {/* Cuisine Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={[styles.filterContent, { backgroundColor: colors.background }]}
      >
        {cuisines.map((cuisine) => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.filterChip,
              { backgroundColor: colors.border },
              selectedCuisine === cuisine && { backgroundColor: colors.tint }
            ]}
            onPress={() => handleCuisineSelect(cuisine)}
          >
            <Text style={[
              styles.filterChipText,
              { color: colors.secondary },
              selectedCuisine === cuisine && { color: '#FFFFFF' }
            ]}>
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={[styles.resultsHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultsCount, { color: colors.secondary }]}>
          {isLoading ? 'Loading…' : `${filteredRestaurants.length} restaurants found`}
        </Text>
      </View>

      {error ? (
        <View style={styles.listContent} testID="search-error">
          <Text style={[styles.resultsCount, { color: colors.error }]}>Could not load restaurants</Text>
          <TouchableOpacity onPress={() => restaurantsQuery.refetch()} style={[styles.retryBtn, { backgroundColor: colors.tint }]} testID="retry-load">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => handleRestaurantPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          testID="search-results-list"
          ListEmptyComponent={!isLoading ? (
            <View style={styles.emptyState} testID="empty-results">
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No restaurants match</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>Try a different search or filter</Text>
            </View>
          ) : null}
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
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
  },
});