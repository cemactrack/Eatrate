import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';
import { Star, Phone, Globe, MapPin, Filter } from 'lucide-react-native';

export type SupplierCategory =
  | 'Produce'
  | 'Meat & Poultry'
  | 'Seafood'
  | 'Dairy'
  | 'Dry Goods'
  | 'Beverages'
  | 'Bakery'
  | 'Spices'
  | 'Packaging';

interface SupplierItemProps {
  item: {
    id: string;
    name: string;
    category: SupplierCategory;
    rating: number;
    minOrder: string;
    deliveryTime: string;
    image: string;
    tags: string[];
    phone?: string;
    website?: string;
    location?: string;
  };
}

function SupplierItem({ item }: SupplierItemProps) {
  return (
    <View style={styles.card} testID={`supplier-${item.id}`}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.ratingRow}>
          <Star size={14} color={Colors.light.warning} />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>Min {item.minOrder}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{item.deliveryTime}</Text>
        </View>
        {(item.location || item.tags.length > 0) && (
          <View style={styles.infoRow}>
            {item.location ? (
              <View style={styles.inlineRow}>
                <MapPin size={14} color={Colors.light.secondary} />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
            ) : null}
            {item.tags.length > 0 ? (
              <Text style={styles.tagsText} numberOfLines={1}>{item.tags.join(' • ')}</Text>
            ) : null}
          </View>
        )}
        <View style={styles.actionsRow}>
          {item.phone ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => {
                const tel = `tel:${item.phone?.replace(/\s/g, '')}`;
                if (Platform.OS === 'web') {
                  window.location.href = tel as unknown as string;
                }
              }}
              testID={`call-${item.id}`}
            >
              <Phone size={16} color={'white'} />
              <Text style={styles.btnText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {item.website ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.siteBtn]}
              onPress={() => {
                if (item.website) {
                  const url = item.website;
                  if (Platform.OS === 'web') {
                    window.open(url, '_blank');
                  }
                }
              }}
              testID={`site-${item.id}`}
            >
              <Globe size={16} color={'white'} />
              <Text style={styles.btnText}>Website</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function SuppliersScreen() {
  const insets = useSafeAreaInsets();
  const query = '';
  const [category, setCategory] = useState<SupplierCategory | undefined>(undefined);

  const { data, isLoading, error, refetch, isRefetching } = trpc.suppliers.list.useQuery(
    { search: query, category },
    { staleTime: 1000 * 60 * 5 }
  );

  const categories = useMemo<readonly (SupplierCategory | 'All')[]>(
    () => [
      'All',
      'Produce',
      'Meat & Poultry',
      'Seafood',
      'Dairy',
      'Dry Goods',
      'Beverages',
      'Bakery',
      'Spices',
      'Packaging',
    ] as const,
    []
  );

  const onSelectCategory = useCallback((c: SupplierCategory | 'All') => {
    const next = c === 'All' ? undefined : (c as SupplierCategory);
    setCategory(next);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <Stack.Screen options={{ title: 'Suppliers', headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => refetch()} testID="refetch-suppliers">
          <Filter size={18} color={'white'} />
          <Text style={styles.filterText}>{isRefetching ? 'Refreshing…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories as readonly string[]}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive = (category ?? 'All') === item;
            return (
              <TouchableOpacity
                onPress={() => onSelectCategory(item as SupplierCategory | 'All')}
                style={[styles.chip, isActive && styles.chipActive]}
                testID={`chip-${item}`}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Could not load suppliers.</Text>
        </View>
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SupplierItem item={item} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={() => (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>{isLoading ? 'Loading suppliers…' : 'No suppliers found'}</Text>
          </View>
        )}
        testID="suppliers-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  filterBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: { color: 'white', fontWeight: '600' },
  btnText: { color: 'white', fontWeight: '700' },
  categoryRow: { paddingVertical: 8 },
  chip: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.light.tint },
  chipText: { color: Colors.light.secondary, fontWeight: '500' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: '100%', height: 160, backgroundColor: Colors.light.border },
  cardContent: { padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.light.text, flex: 1, marginRight: 8 },
  categoryPill: { backgroundColor: Colors.light.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  categoryText: { color: Colors.light.warning, fontWeight: '700', fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  metaDot: { color: Colors.light.secondary },
  metaText: { color: Colors.light.secondary, fontSize: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: Colors.light.secondary, marginLeft: 4 },
  tagsText: { color: Colors.light.secondary, flex: 1, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  callBtn: { backgroundColor: Colors.light.success },
  siteBtn: { backgroundColor: Colors.light.text },
  centerBox: { padding: 24, alignItems: 'center' },
  emptyText: { color: Colors.light.secondary },
  errorText: { color: Colors.light.error },
});