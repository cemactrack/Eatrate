import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter } from 'lucide-react-native';

import { trpc } from '@/lib/trpc';
import { useSettings } from '@/providers/SettingsProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import RestaurantCard from '@/components/RestaurantCard';
import DishCard from '@/components/DishCard';
import { Restaurant, Dish } from '@/types/restaurant';
import { useDebounce } from '@/hooks/useDebounce';

type SearchType = 'all' | 'restaurants' | 'dishes';
type PriceRange = '$' | '$$' | '$$$' | '$$$$';
type SortBy = 'relevance' | 'rating' | 'distance' | 'price';

interface SearchFilters {
  cuisine?: string;
  priceRange?: PriceRange[];
  rating?: number;
  location?: string;
  sortBy?: SortBy;
}

export default function SearchScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  const debouncedQuery = useDebounce(searchQuery, 300);
  const shouldSearch = debouncedQuery.trim().length > 0;
  
  // Restaurant search
  const restaurantSearch = trpc.restaurantsMain.search.useQuery(
    { 
      query: debouncedQuery.trim(),
      limit: 20,
      ...filters
    },
    { 
      enabled: shouldSearch && (searchType === 'all' || searchType === 'restaurants'),
      staleTime: 1000 * 60 * 5
    }
  );
  
  // Dish search (using available endpoint)
  const dishSearch = trpc.dishes.list.useQuery(
    undefined,
    { 
      enabled: shouldSearch && (searchType === 'all' || searchType === 'dishes'),
      staleTime: 1000 * 60 * 5
    }
  );
  
  // Bookmark mutations
  const bookmarkRestaurant = trpc.bookmarks.toggleRestaurant.useMutation();
  const bookmarkDish = trpc.bookmarks.toggleDish.useMutation();
  
  const restaurants = useMemo(() => {
    const data = restaurantSearch.data ?? [];
    return Array.isArray(data) ? data.map((r: any): Restaurant => ({
      id: r.id,
      name: r.name ?? 'Unknown',
      cuisine: r.cuisine ?? 'Various',
      rating: Number(r.rating ?? 0),
      reviewCount: Number(r.reviewCount ?? 0),
      image: r.image_url ?? 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200',
      address: r.address ?? '—',
      priceRange: (r.price_range as Restaurant['priceRange']) ?? '$',
      distance: r.distance,
      isOpen: true,
      tags: r.tags ?? [],
      verified: r.verified ?? false,
      claimed: r.claimed ?? false,
    })) : [];
  }, [restaurantSearch.data]);
  
  const dishes = useMemo(() => {
    const data = dishSearch.data?.dishes ?? [];
    const filteredDishes = shouldSearch 
      ? data.filter((d: any) => 
          d.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      : [];
    
    return filteredDishes.map((d: any): Dish => ({
      id: d.id,
      name: d.name ?? 'Unknown Dish',
      restaurant: d.restaurant_name ?? 'Unknown Restaurant',
      rating: Number(d.rating ?? 0),
      reviewCount: Number(d.reviewCount ?? 0),
      image: d.image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      price: Number(d.price ?? 0),
      description: d.description ?? '',
      category: d.category ?? 'Main Course',
      tags: d.tags ?? [],
    }));
  }, [dishSearch.data?.dishes, shouldSearch, debouncedQuery]);
  
  const handleRestaurantPress = useCallback((restaurantId: string) => {
    router.push(`/restaurants/${restaurantId}`);
  }, [router]);
  
  const handleDishPress = useCallback((dishId: string) => {
    console.log('Dish pressed:', dishId);
    // Navigate to dish detail or restaurant
  }, []);
  
  const handleBookmarkRestaurant = useCallback(async (restaurantId: string) => {
    try {
      await bookmarkRestaurant.mutateAsync({ restaurantId });
    } catch (error) {
      console.error('Failed to bookmark restaurant:', error);
    }
  }, [bookmarkRestaurant]);
  
  const handleBookmarkDish = useCallback(async (dishId: string) => {
    try {
      await bookmarkDish.mutateAsync({ dishId });
    } catch (error) {
      console.error('Failed to bookmark dish:', error);
    }
  }, [bookmarkDish]);
  
  const renderSearchTypeButton = (type: SearchType, label: string, count: number) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.searchTypeButton,
        {
          backgroundColor: searchType === type ? colors.tint : colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => setSearchType(type)}
    >
      <Text
        style={[
          styles.searchTypeText,
          { color: searchType === type ? 'white' : colors.text },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: searchType === type ? 'rgba(255,255,255,0.3)' : colors.accent,
            },
          ]}
        >
          <Text
            style={[
              styles.countText,
              { color: searchType === type ? 'white' : colors.tint },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  const isLoading = restaurantSearch.isLoading || dishSearch.isLoading;
  const hasError = restaurantSearch.error || dishSearch.error;
  const hasResults = restaurants.length > 0 || dishes.length > 0;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.background }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search restaurants, dishes..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Search Type Tabs */}
      {shouldSearch && (
        <View style={[styles.searchTypesContainer, { backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchTypesContent}>
            {renderSearchTypeButton('all', 'All', restaurants.length + dishes.length)}
            {renderSearchTypeButton('restaurants', 'Restaurants', restaurants.length)}
            {renderSearchTypeButton('dishes', 'Dishes', dishes.length)}
          </ScrollView>
        </View>
      )}
      
      {/* Results */}
      {!shouldSearch ? (
        <View style={styles.emptyContainer}>
          <Search size={64} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search for food</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            Find restaurants, dishes, and more
          </Text>
        </View>
      ) : isLoading ? (
        <LoadingSpinner text="Searching..." />
      ) : hasError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Search failed</Text>
          <Text style={[styles.errorMessage, { color: colors.secondary }]}>
            Please check your connection and try again
          </Text>
        </View>
      ) : !hasResults ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            Try adjusting your search terms
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(searchType === 'all' || searchType === 'restaurants' ? restaurants : []),
            ...(searchType === 'all' || searchType === 'dishes' ? dishes : []),
          ]}
          keyExtractor={(item) => `${item.id}-${('cuisine' in item) ? 'restaurant' : 'dish'}`}
          renderItem={({ item }) => {
            if ('cuisine' in item) {
              // Restaurant
              return (
                <RestaurantCard
                  restaurant={item as Restaurant}
                  onPress={() => handleRestaurantPress(item.id)}
                  onToggleFavorite={() => handleBookmarkRestaurant(item.id)}
                />
              );
            } else {
              // Dish
              return (
                <DishCard
                  dish={item as Dish}
                  onPress={() => handleDishPress(item.id)}
                />
              );
            }
          }}
          contentContainerStyle={styles.resultsContainer}
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
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTypesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchTypesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultsContainer: {
    paddingBottom: 20,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});