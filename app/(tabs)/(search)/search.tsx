import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Filter, SortAsc, Grid, List } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { DEFAULT_TRIPADVISOR_URLS } from '@/constants/tripadvisor-urls';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { useSettings } from '@/providers/SettingsProvider';
import { Restaurant } from '@/types/restaurant';
import { useStorage } from '@/providers/StorageProvider';

type SortOption = 'name' | 'rating' | 'reviewCount' | 'distance';
type ViewMode = 'list' | 'grid';
type LocationFilter = 'all' | 'douala' | 'yaounde' | 'buea' | 'limbe';

interface SearchFilters {
  location: LocationFilter;
  priceRange: string[];
  rating: number;
  isOpen: boolean | null;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({
    location: 'all',
    priceRange: [],
    rating: 0,
    isOpen: null,
    sortBy: 'rating',
    sortOrder: 'desc'
  });
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');
  const [importedRestaurants, setImportedRestaurants] = useState<Restaurant[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [bootstrapped, setBootstrapped] = useState<boolean>(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useSettings();
  const { getItem, setItem } = useStorage();

  const importedOneTimeQuery = trpc.restaurants.getImportedOneTime.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });

  // Fetch restaurants from multiple locations based on filter
  const doualaQuery = trpc.restaurants.douala.useQuery(
    { pages: [1, 2] }, 
    { 
      enabled: filters.location === 'all' || filters.location === 'douala',
      staleTime: 1000 * 60 * 30,
      retry: 1
    }
  );
  
  const yaoundeQuery = trpc.restaurants.yaounde.useQuery(
    { pages: [1, 2] }, 
    { 
      enabled: filters.location === 'all' || filters.location === 'yaounde',
      staleTime: 1000 * 60 * 30,
      retry: 1
    }
  );
  
  const bueaQuery = trpc.restaurants.buea.useQuery(
    { pages: [1] }, 
    { 
      enabled: filters.location === 'all' || filters.location === 'buea',
      staleTime: 1000 * 60 * 30,
      retry: 1
    }
  );
  
  const limbeQuery = trpc.restaurants.limbe.useQuery(
    { pages: [1] }, 
    { 
      enabled: filters.location === 'all' || filters.location === 'limbe',
      staleTime: 1000 * 60 * 30,
      retry: 1
    }
  );

  const allRestaurants = useMemo(() => {
    const restaurants: Restaurant[] = [];
    if (doualaQuery.data?.restaurants) restaurants.push(...doualaQuery.data.restaurants);
    if (yaoundeQuery.data?.restaurants) restaurants.push(...yaoundeQuery.data.restaurants);
    if (bueaQuery.data?.restaurants) restaurants.push(...bueaQuery.data.restaurants);
    if (limbeQuery.data?.restaurants) restaurants.push(...limbeQuery.data.restaurants);
    if (importedRestaurants.length > 0) restaurants.push(...importedRestaurants);
    const unique = new Map<string, Restaurant>();
    restaurants.forEach((r: Restaurant) => {
      const key = r.name.toLowerCase().trim();
      if (!unique.has(key)) unique.set(key, r);
    });
    console.log('[Search] Total unique restaurants:', unique.size, 'Imported:', importedRestaurants.length);
    return Array.from(unique.values());
  }, [doualaQuery.data, yaoundeQuery.data, bueaQuery.data, limbeQuery.data, importedRestaurants]);

  const isLoading = doualaQuery.isLoading || yaoundeQuery.isLoading || bueaQuery.isLoading || limbeQuery.isLoading || importedOneTimeQuery.isLoading;
  const hasError = doualaQuery.error || yaoundeQuery.error || bueaQuery.error || limbeQuery.error || importedOneTimeQuery.error;

  const cuisines = useMemo(() => {
    const set = new Set<string>(['All']);
    allRestaurants.forEach((r: Restaurant) => set.add(r.cuisine));
    return Array.from(set).sort();
  }, [allRestaurants]);

  const filteredAndSortedRestaurants = useMemo(() => {
    let filtered = allRestaurants.filter((restaurant: Restaurant) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query) ||
        restaurant.tags.some((tag: string) => tag.toLowerCase().includes(query));
      
      const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;
      
      const matchesPriceRange = filters.priceRange.length === 0 || 
        filters.priceRange.includes(restaurant.priceRange);
      
      const matchesRating = restaurant.rating >= filters.rating;
      
      const matchesOpenStatus = filters.isOpen === null || restaurant.isOpen === filters.isOpen;
      
      return matchesSearch && matchesCuisine && matchesPriceRange && matchesRating && matchesOpenStatus;
    });

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'reviewCount':
          comparison = a.reviewCount - b.reviewCount;
          break;
        case 'distance':
          // Mock distance sorting - in real app would use actual location
          comparison = Math.random() - 0.5;
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [allRestaurants, searchQuery, selectedCuisine, filters]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('Restaurant pressed:', restaurantId);
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const toggleFavorite = useCallback((restaurantId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(restaurantId)) {
        newFavorites.delete(restaurantId);
      } else {
        newFavorites.add(restaurantId);
      }
      return newFavorites;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        doualaQuery.refetch(),
        yaoundeQuery.refetch(),
        bueaQuery.refetch(),
        limbeQuery.refetch(),
        importedOneTimeQuery.refetch(),
      ]);
      const stored = await getItem('imported_restaurants');
      if (stored) {
        const parsed: Restaurant[] = JSON.parse(stored);
        setImportedRestaurants(parsed);
      }
    } catch (e) {
      console.log('[Search] refresh error');
    } finally {
      setRefreshing(false);
    }
  }, [doualaQuery, yaoundeQuery, bueaQuery, limbeQuery, getItem]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      location: 'all',
      priceRange: [],
      rating: 0,
      isOpen: null,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
    setSelectedCuisine('All');
    setSearchQuery('');
  }, []);

  const handleCuisineSelect = useCallback((cuisine: string) => {
    if (cuisine && cuisine.trim() && cuisine.length <= 50) {
      setSelectedCuisine(cuisine.trim());
    }
  }, []);

  const importMutation = trpc.restaurants.importFromTripadvisor.useMutation();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await getItem('imported_restaurants');
      if (stored && isMounted) {
        const parsed: Restaurant[] = JSON.parse(stored);
        setImportedRestaurants(parsed);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getItem]);

  useEffect(() => {
    if (importedOneTimeQuery.data?.restaurants && Array.isArray(importedOneTimeQuery.data.restaurants)) {
      setImportedRestaurants(prev => {
        const map = new Map<string, Restaurant>();
        [...prev, ...importedOneTimeQuery.data!.restaurants].forEach((r) => {
          map.set(r.name.toLowerCase().trim(), r);
        });
        return Array.from(map.values());
      });
    }
  }, [importedOneTimeQuery.data]);

  useEffect(() => {
    const shouldBootstrap = !bootstrapped && !isImporting && importedRestaurants.length === 0 && (importedOneTimeQuery.data?.restaurants?.length ?? 0) === 0;
    if (!shouldBootstrap) return;
    setBootstrapped(true);
    console.log('[Search] Starting one-time import of TripAdvisor restaurants...');
    (async () => {
      try {
        console.log('[Search] Importing from URLs:', DEFAULT_TRIPADVISOR_URLS);
        const res = await importMutation.mutateAsync({ urls: DEFAULT_TRIPADVISOR_URLS, cityFallback: 'Cameroon' });
        const list = res.restaurants as Restaurant[];
        console.log('[Search] Import successful, imported', list.length, 'restaurants');
        setImportedRestaurants(list);
        await setItem('imported_restaurants', JSON.stringify(list));
      } catch (e) {
        console.error('[Search] bootstrap import failed:', e);
      }
    })();
  }, [bootstrapped, isImporting, importedRestaurants.length, importedOneTimeQuery.data, importMutation, setItem]);

  const parseUrls = useCallback((input: string): string[] => {
    const raw = input.split(/\s|,|;|\n|\r/).map(s => s.trim()).filter(Boolean);
    const urls = Array.from(new Set(raw.filter((s) => /^https?:\/\//i.test(s))));
    return urls.slice(0, 50);
  }, []);

  const handleImport = useCallback(async () => {
    if (isImporting) return;
    const urls = parseUrls(importInput);
    if (urls.length === 0) {
      return;
    }
    setIsImporting(true);
    try {
      const res = await importMutation.mutateAsync({ urls, cityFallback: 'Cameroon' });
      const list = res.restaurants as Restaurant[];
      setImportedRestaurants(list);
      await setItem('imported_restaurants', JSON.stringify(list));
      setImportModalVisible(false);
      setImportInput('');
    } catch (e) {
    } finally {
      setIsImporting(false);
    }
  }, [importInput, importMutation, parseUrls, setItem, isImporting]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]} testID="search-screen">
      <Stack.Screen options={{ title: 'Search', headerShown: false }} />
      
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search restaurants, cuisines, locations..."
        onFilterPress={() => setShowFilters(true)}
      />

      <View style={styles.importRow}>
        <TouchableOpacity
          testID="open-import-modal"
          onPress={async () => {
            if (isImporting) return;
            setIsImporting(true);
            console.log('[Search] Manual import triggered');
            try {
              console.log('[Search] Importing from URLs:', DEFAULT_TRIPADVISOR_URLS);
              const res = await importMutation.mutateAsync({ urls: DEFAULT_TRIPADVISOR_URLS, cityFallback: 'Cameroon' });
              const list = res.restaurants as Restaurant[];
              console.log('[Search] Manual import successful, imported', list.length, 'restaurants');
              setImportedRestaurants(list);
              await setItem('imported_restaurants', JSON.stringify(list));
            } catch (e) {
              console.error('[Search] one-click import failed:', e);
            } finally {
              setIsImporting(false);
            }
          }}
          style={[styles.importBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.importBtnText}>{isImporting ? 'Importing…' : 'Re-import Restaurants'}</Text>
        </TouchableOpacity>
        {importedRestaurants.length > 0 && (
          <View style={styles.importInfo}>
            <Text style={[styles.importInfoText, { color: colors.secondary }]}>Imported: {importedRestaurants.length}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContent}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => updateFilter('location', filters.location === 'douala' ? 'all' : 'douala')}
          >
            <MapPin size={16} color={filters.location === 'douala' ? colors.tint : colors.secondary} />
            <Text style={[styles.quickActionText, { 
              color: filters.location === 'douala' ? colors.tint : colors.secondary 
            }]}>Douala</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => updateFilter('location', filters.location === 'yaounde' ? 'all' : 'yaounde')}
          >
            <MapPin size={16} color={filters.location === 'yaounde' ? colors.tint : colors.secondary} />
            <Text style={[styles.quickActionText, { 
              color: filters.location === 'yaounde' ? colors.tint : colors.secondary 
            }]}>Yaoundé</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => updateFilter('isOpen', filters.isOpen === true ? null : true)}
          >
            <Text style={[styles.quickActionText, { 
              color: filters.isOpen === true ? colors.tint : colors.secondary 
            }]}>Open Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => updateFilter('rating', filters.rating >= 4 ? 0 : 4)}
          >
            <Text style={[styles.quickActionText, { 
              color: filters.rating >= 4 ? colors.tint : colors.secondary 
            }]}>4+ Stars</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

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

      {/* Results Header */}
      <View style={[styles.resultsHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.resultsInfo}>
          <Text style={[styles.resultsCount, { color: colors.secondary }]}>
            {isLoading ? 'Loading…' : `${filteredAndSortedRestaurants.length} restaurants found`}
          </Text>
          {filters.location !== 'all' && (
            <Text style={[styles.locationFilter, { color: colors.tint }]}>
              in {filters.location.charAt(0).toUpperCase() + filters.location.slice(1)}
            </Text>
          )}
        </View>
        
        <View style={styles.viewControls}>
          <TouchableOpacity 
            style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
              updateFilter('sortOrder', newOrder);
            }}
          >
            <SortAsc size={16} color={colors.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 
              <Grid size={16} color={colors.secondary} /> : 
              <List size={16} color={colors.secondary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {hasError ? (
        <View style={styles.listContent} testID="search-error">
          <Text style={[styles.errorTitle, { color: colors.error }]}>Could not load restaurants</Text>
          <Text style={[styles.errorSubtitle, { color: colors.secondary }]}>Check your connection and try again</Text>
          <TouchableOpacity onPress={handleRefresh} style={[styles.retryBtn, { backgroundColor: colors.tint }]} testID="retry-load">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedRestaurants}
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? styles.gridItem : undefined}>
              <RestaurantCard
                restaurant={item}
                onPress={() => handleRestaurantPress(item.id)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          testID="search-results-list"
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          ListEmptyComponent={!isLoading ? (
            <View style={styles.emptyState} testID="empty-results">
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No restaurants found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>Try adjusting your search or filters</Text>
              {(searchQuery || selectedCuisine !== 'All' || filters.location !== 'all') && (
                <TouchableOpacity 
                  style={[styles.clearFiltersBtn, { backgroundColor: colors.tint }]} 
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          ListHeaderComponent={isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.secondary }]}>Finding restaurants...</Text>
            </View>
          ) : null}
        />
      )}

      <Modal
        visible={importModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>One-time Import</Text>
            <TouchableOpacity onPress={() => setImportModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.tint }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.importContent}>
            <Text style={[styles.importHelp, { color: colors.secondary }]}>Paste one or more TripAdvisor restaurant list URLs. Separate by space, comma, or newline.</Text>
            <TextInput
              testID="import-input"
              value={importInput}
              onChangeText={setImportInput}
              placeholder="https://www.tripadvisor.com/Restaurants-..."
              placeholderTextColor={colors.secondary}
              multiline
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TouchableOpacity
              testID="run-import"
              onPress={handleImport}
              disabled={isImporting}
              style={[styles.importPrimaryBtn, { backgroundColor: colors.tint, opacity: isImporting ? 0.6 : 1 }]}
            >
              <Text style={styles.importPrimaryText}>{isImporting ? 'Importing…' : 'Import Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filters & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={[styles.modalClose, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Location</Text>
              <View style={styles.filterOptions}>
                {(['all', 'douala', 'yaounde', 'buea', 'limbe'] as LocationFilter[]).map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      filters.location === location && { backgroundColor: colors.tint, borderColor: colors.tint }
                    ]}
                    onPress={() => updateFilter('location', location)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      filters.location === location && { color: '#FFFFFF' }
                    ]}>
                      {location === 'all' ? 'All Cities' : location.charAt(0).toUpperCase() + location.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Price Range</Text>
              <View style={styles.filterOptions}>
                {['$', '$$', '$$$', '$$$$'].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      filters.priceRange.includes(price) && { backgroundColor: colors.tint, borderColor: colors.tint }
                    ]}
                    onPress={() => {
                      const newPriceRange = filters.priceRange.includes(price)
                        ? filters.priceRange.filter(p => p !== price)
                        : [...filters.priceRange, price];
                      updateFilter('priceRange', newPriceRange);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      filters.priceRange.includes(price) && { color: '#FFFFFF' }
                    ]}>
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Minimum Rating</Text>
              <View style={styles.filterOptions}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      filters.rating === rating && { backgroundColor: colors.tint, borderColor: colors.tint }
                    ]}
                    onPress={() => updateFilter('rating', rating)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      filters.rating === rating && { color: '#FFFFFF' }
                    ]}>
                      {rating === 0 ? 'Any' : `${rating}+ Stars`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Sort By</Text>
              <View style={styles.filterOptions}>
                {([{ key: 'rating', label: 'Rating' }, { key: 'name', label: 'Name' }, { key: 'reviewCount', label: 'Reviews' }] as { key: SortOption, label: string }[]).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      filters.sortBy === key && { backgroundColor: colors.tint, borderColor: colors.tint }
                    ]}
                    onPress={() => updateFilter('sortBy', key)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      filters.sortBy === key && { color: '#FFFFFF' }
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.clearAllBtn, { backgroundColor: colors.error }]} 
              onPress={clearFilters}
            >
              <Text style={styles.clearAllText}>Clear All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  importRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  importBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  importInfo: {
    marginLeft: 10,
  },
  importInfoText: {
    fontSize: 12,
  },
  quickActions: {
    paddingVertical: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultsInfo: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationFilter: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  gridItem: {
    flex: 1,
    margin: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'center',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFiltersBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  importContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  importHelp: {
    fontSize: 13,
    marginBottom: 10,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  importPrimaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  filterSection: {
    marginVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllBtn: {
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});