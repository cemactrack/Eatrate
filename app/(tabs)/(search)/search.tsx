import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { MapPin, SortAsc, Grid, List } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
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

  const needsImportQuery = trpc.restaurants.needsInitialImport.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  const bootstrapMutation = trpc.restaurants.bootstrapImport.useMutation();

  // Fetch restaurants from multiple locations based on filter
  const doualaQuery = trpc.restaurants.douala.useQuery({ 
    pages: [1, 2] 
  }, { 
    enabled: filters.location === 'all' || filters.location === 'douala',
    staleTime: 1000 * 60 * 30,
    retry: 1
  });
  
  const yaoundeQuery = trpc.restaurants.yaounde.useQuery({ 
    pages: [1, 2] 
  }, { 
    enabled: filters.location === 'all' || filters.location === 'yaounde',
    staleTime: 1000 * 60 * 30,
    retry: 1
  });
  
  const bueaQuery = trpc.restaurants.buea.useQuery({ 
    pages: [1] 
  }, { 
    enabled: filters.location === 'all' || filters.location === 'buea',
    staleTime: 1000 * 60 * 30,
    retry: 1
  });
  
  const limbeQuery = trpc.restaurants.limbe.useQuery({ 
    pages: [1] 
  }, { 
    enabled: filters.location === 'all' || filters.location === 'limbe',
    staleTime: 1000 * 60 * 30,
    retry: 1
  });

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

  const isLoading = doualaQuery.isLoading || yaoundeQuery.isLoading || bueaQuery.isLoading || limbeQuery.isLoading || importedOneTimeQuery.isLoading || needsImportQuery.isLoading || bootstrapMutation.isPending;
  const hasError = doualaQuery.error || yaoundeQuery.error || bueaQuery.error || limbeQuery.error || importedOneTimeQuery.error;

  const cuisines = useMemo(() => {
    const set = new Set<string>(['All']);
    allRestaurants.forEach((r: Restaurant) => set.add(r.cuisine));
    return Array.from(set).sort();
  }, [allRestaurants]);

  const remoteSearch = trpc.restaurantsMain.search.useQuery(
    { query: searchQuery.trim() || 'a', limit: 50 },
    { enabled: searchQuery.trim().length > 0 }
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

  const filteredAndSortedRestaurants = useMemo(() => {
    const base = searchQuery.trim().length > 0
      ? (Array.isArray(remoteSearch.data) ? remoteSearch.data.map(mapItem) : [])
      : allRestaurants;

    let filtered = base.filter((restaurant: Restaurant) => {
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
          comparison = Math.random() - 0.5;
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [allRestaurants, searchQuery, selectedCuisine, filters, remoteSearch.data, mapItem]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    console.log('Restaurant pressed:', restaurantId);
    router.push(`/restaurants/${restaurantId}` as const);
  }, [router]);

  const handleSearch = useCallback((query: string) => {
    if (query && query.trim() && query.length <= 100) {
      setSearchQuery(query.trim());
    } else if (!query) {
      setSearchQuery('');
    }
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
        needsImportQuery.refetch(),
      ]);
      const stored = await getItem('imported_restaurants');
      if (stored) {
        const parsed: Restaurant[] = JSON.parse(stored);
        setImportedRestaurants(parsed);
      }
    } catch (error) {
      console.log('[Search] refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [doualaQuery, yaoundeQuery, bueaQuery, limbeQuery, importedOneTimeQuery, needsImportQuery, getItem]);

  const updateFilter = useCallback(
    (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
      setFilters(prev => ({ ...prev, [key]: value } as SearchFilters));
    },
    []
  );

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

  // Bootstrap import effect - runs once when app starts if database is empty
  useEffect(() => {
    const shouldBootstrap = needsImportQuery.data?.needsImport && !bootstrapped && !bootstrapMutation.isPending;
    if (!shouldBootstrap) return;
    
    setBootstrapped(true);
    console.log('[Search] Database is empty, starting bootstrap import...');
    
    (async () => {
      try {
        const res = await bootstrapMutation.mutateAsync();
        console.log('[Search] Bootstrap import result:', res.message, 'Restaurants:', res.imported);
        
        if (res.restaurants && res.restaurants.length > 0) {
          setImportedRestaurants(res.restaurants as Restaurant[]);
          await setItem('imported_restaurants', JSON.stringify(res.restaurants));
        }
        
        // Refresh the imported query after bootstrap
        await importedOneTimeQuery.refetch();
      } catch (e) {
        console.error('[Search] Bootstrap import failed:', e);
      }
    })();
  }, [needsImportQuery.data?.needsImport, bootstrapped, bootstrapMutation, setItem, importedOneTimeQuery]);

  // Force initial bootstrap on first load if needed
  useEffect(() => {
    let isMounted = true;
    
    const forceBootstrapIfNeeded = async () => {
      // Wait a bit for queries to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isMounted) return;
      
      // Check if we have any restaurants at all
      const hasAnyRestaurants = allRestaurants.length > 0;
      const hasImportedData = (importedOneTimeQuery.data?.restaurants?.length ?? 0) > 0;
      
      // Always try to bootstrap if we don't have data and haven't tried yet
      if (!hasAnyRestaurants && !hasImportedData && !bootstrapMutation.isPending && !bootstrapped) {
        console.log('[Search] No restaurants found, forcing bootstrap import...');
        setBootstrapped(true);
        
        try {
          const res = await bootstrapMutation.mutateAsync();
          console.log('[Search] Force bootstrap result:', res.message, 'Restaurants:', res.imported);
          
          if (res.restaurants && res.restaurants.length > 0) {
            setImportedRestaurants(res.restaurants as Restaurant[]);
            await setItem('imported_restaurants', JSON.stringify(res.restaurants));
          }
          
          await importedOneTimeQuery.refetch();
        } catch (e) {
          console.error('[Search] Force bootstrap failed:', e);
          setBootstrapped(false); // Allow retry
        }
      }
    };
    
    // Run immediately and also after a short delay
    forceBootstrapIfNeeded();
    const timer = setTimeout(forceBootstrapIfNeeded, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [allRestaurants.length, importedOneTimeQuery.data?.restaurants?.length, bootstrapMutation, bootstrapped, setItem, importedOneTimeQuery]);

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
    } catch (error) {
      console.error('[Search] Import failed:', error);
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
          testID="refresh-restaurants"
          onPress={async () => {
            if (bootstrapMutation.isPending) return;
            console.log('[Search] Manual refresh triggered');
            try {
              const res = await bootstrapMutation.mutateAsync();
              console.log('[Search] Refresh result:', res.message, 'Restaurants:', res.imported);
              
              if (res.restaurants && res.restaurants.length > 0) {
                setImportedRestaurants(res.restaurants as Restaurant[]);
                await setItem('imported_restaurants', JSON.stringify(res.restaurants));
              }
              
              // Also refresh the imported query
              await importedOneTimeQuery.refetch();
            } catch (error) {
              console.error('[Search] Refresh failed:', error);
            }
          }}
          style={[styles.importBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.importBtnText}>
            {bootstrapMutation.isPending ? 'Refreshing…' : 'Refresh Restaurants'}
          </Text>
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
          key={viewMode}

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