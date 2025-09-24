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
  const { data, isLoading, error } = trpc.restaurants.yaounde.useQuery(
    { page: 1 },
    { staleTime: 1000 * 60 * 10 }
  );
  
  const list = useMemo<Restaurant[]>(() => data?.restaurants ?? [], [data?.restaurants]);
  
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((restaurant) => 
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.cuisine.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query) ||
      restaurant.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [list, searchQuery]);
  
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
          {isLoading ? 'Loading...' : `${filteredRestaurants.length} restaurants`}
        </Text>
      </View>
      {isLoading ? (
        <LoadingSpinner text="Loading Yaoundé restaurants..." />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn’t load restaurants</Text>
          <Text style={styles.emptySubtitle}>Please check your connection and try again.</Text>
        </View>
      ) : list.length === 0 ? (
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