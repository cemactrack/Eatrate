import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';
import CalorieEstimator from '@/components/CalorieEstimator';
import { trpc } from '@/lib/trpc';
import { ArrowRight, MapPin, Utensils } from 'lucide-react-native';
import { useDebouncedValue } from '@/hooks/useQueries';
import type { Restaurant } from '@/types/restaurant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AIFoodScannerScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState<string>('');
  const debounced = useDebouncedValue(query, 400);

  const searchQuery = trpc.restaurants.search.useQuery(
    { query: debounced, limit: 10 },
    { enabled: debounced.length > 0 }
  );

  const onComplete = useCallback((nutrition: any) => {
    try {
      const recognized: string | undefined = nutrition?.recognizedFood?.name ?? nutrition?.name;
      const dish = typeof recognized === 'string' && recognized.length > 0 ? recognized : undefined;
      if (dish) setQuery(dish);
    } catch (e) {
      console.log('[AIFoodScanner] parse result error', e);
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={() => router.push(`/restaurants/${item.id}` as const)}
      testID={`scanner-restaurant-${item.id}`}
    >
      <View style={styles.cardHeader}>
        <Utensils size={18} color={colors.tint} />
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <MapPin size={16} color={colors.secondary} />
        <Text style={[styles.cardSubtitle, { color: colors.secondary }]} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.linkText, { color: colors.tint }]}>View details</Text>
        <ArrowRight size={16} color={colors.tint} />
      </View>
    </TouchableOpacity>
  ), [colors, router]);

  const listHeader = useMemo(() => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby places serving it</Text>
    </View>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top - 8, 0), paddingBottom: insets.bottom + 8 }]} testID="ai-scanner-screen">
      <Stack.Screen options={{ title: 'AI Food Scanner' }} />

      <CalorieEstimator onEstimationComplete={onComplete} onRecognizedDish={(name) => setQuery(name)} />

      {debounced.length === 0 ? (
        <View style={styles.helper}>
          <Text style={[styles.helperText, { color: colors.secondary }]}>Take or upload a photo to identify a dish and see nearby restaurants.</Text>
        </View>
      ) : searchQuery.isLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.tint} />
          <Text style={[styles.loaderText, { color: colors.secondary }]}>Searching for {debounced}…</Text>
        </View>
      ) : searchQuery.error ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: colors.error }]}>Failed to search nearby restaurants. Pull to retry.</Text>
        </View>
      ) : (
        <FlatList
          data={(searchQuery.data?.restaurants as Restaurant[] | undefined) ?? []}
          keyExtractor={(it) => String(it.id)}
          ListHeaderComponent={listHeader as any}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  helper: { paddingHorizontal: 16, paddingBottom: 16 },
  helperText: { fontSize: 14, lineHeight: 20 },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  loaderText: { fontSize: 14 },
  errorBox: { paddingHorizontal: 16, paddingVertical: 8 },
  errorText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  sectionHeader: { paddingHorizontal: 4, paddingVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardSubtitle: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  linkText: { fontSize: 13, fontWeight: '600' },
});