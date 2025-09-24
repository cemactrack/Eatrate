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
import Colors from '@/constants/colors';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const restaurantsQuery = trpc.restaurants.douala.useQuery({}, { 
    staleTime: 1000 * 60 * 20,
    retry: 0,
    refetchOnMount: false,
  });
  const { data, isLoading, error } = restaurantsQuery;

  const cuisines = useMemo(() => {
    const set = new Set<string>(['All']);
    (data?.restaurants ?? []).forEach(r => set.add(r.cuisine));
    return Array.from(set);
  }, [data?.restaurants]);

  const filteredRestaurants = useMemo(() => {
    const list = data?.restaurants ?? [];
    return list.filter((restaurant) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = restaurant.name.toLowerCase().includes(query) ||
                           restaurant.cuisine.toLowerCase().includes(query) ||
                           restaurant.tags.some(tag => tag.toLowerCase().includes(query));
      
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        contentContainerStyle={styles.filterContent}
      >
        {cuisines.map((cuisine) => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.filterChip,
              selectedCuisine === cuisine && styles.filterChipActive
            ]}
            onPress={() => handleCuisineSelect(cuisine)}
          >
            <Text style={[
              styles.filterChipText,
              selectedCuisine === cuisine && styles.filterChipTextActive
            ]}>
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {isLoading ? 'Loading…' : `${filteredRestaurants.length} restaurants found`}
        </Text>
      </View>

      {error ? (
        <View style={styles.listContent}>
          <Text style={styles.resultsCount}>Could not load restaurants</Text>
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
  filterContainer: {
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  resultsCount: {
    fontSize: 16,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
});