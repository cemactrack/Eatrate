import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Restaurant } from '@/types/restaurant';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';

export type Gap = {
  key: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  hint: string;
};

function scoreFromGaps(gaps: Gap[]): number {
  const max = 100;
  if (gaps.length === 0) return max;
  const penalty = gaps.reduce((acc, g) => acc + (g.severity === 'high' ? 15 : g.severity === 'medium' ? 8 : 3), 0);
  const s = Math.max(0, max - penalty);
  return s;
}

export default function RestaurantProfileAudit({ restaurant }: { restaurant: Restaurant }) {
  const gaps = useMemo<Gap[]>(() => {
    const list: Gap[] = [];

    if (!restaurant.image || restaurant.image.trim().length < 10) {
      list.push({ key: 'image', label: 'Cover image', severity: 'high', hint: 'Add a high-quality photo' });
    }

    if (!restaurant.address || restaurant.address.trim().length < 5) {
      list.push({ key: 'address', label: 'Address', severity: 'high', hint: 'Provide precise street and city' });
    }

    const cuisine = restaurant.cuisine?.trim() ?? '';
    if (!cuisine || cuisine.toLowerCase() === 'international') {
      list.push({ key: 'cuisine', label: 'Cuisine', severity: 'medium', hint: 'Specify primary cuisine' });
    }

    if (!restaurant.tags || restaurant.tags.length < 2) {
      list.push({ key: 'tags', label: 'Tags', severity: 'medium', hint: 'Add 3–5 relevant tags' });
    }

    if (!restaurant.reviewCount || restaurant.reviewCount === 0) {
      list.push({ key: 'reviews', label: 'Reviews', severity: 'medium', hint: 'Encourage first reviews' });
    }

    if (!restaurant.rating || restaurant.rating <= 0) {
      list.push({ key: 'rating', label: 'Rating', severity: 'low', hint: 'Ratings appear after reviews' });
    }

    if (!restaurant.priceRange) {
      list.push({ key: 'priceRange', label: 'Price range', severity: 'low', hint: 'Set $, $$, $$$, or $$$$' });
    }

    return list;
  }, [restaurant.address, restaurant.cuisine, restaurant.image, restaurant.priceRange, restaurant.rating, restaurant.reviewCount, restaurant.tags]);

  const score = useMemo<number>(() => scoreFromGaps(gaps), [gaps]);

  return (
    <View style={styles.container} testID="restaurant-audit">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile completeness</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{score}%</Text>
        </View>
      </View>

      {gaps.length === 0 ? (
        <View style={styles.okRow}>
          <CheckCircle2 size={18} color={Colors.light.success} />
          <Text style={styles.okText}>Looks great. No gaps detected.</Text>
        </View>
      ) : (
        <View style={styles.gapList}>
          {gaps.map((g) => (
            <View key={g.key} style={styles.gapItem}>
              <AlertTriangle size={16} color={g.severity === 'high' ? Colors.light.error : g.severity === 'medium' ? Colors.light.warning : Colors.light.secondary} />
              <Text style={styles.gapLabel}>{g.label}</Text>
              <View style={styles.dot} />
              <Text style={styles.gapHint}>{g.hint}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.light.accent,
  },
  scoreText: {
    color: Colors.light.tint,
    fontWeight: '700',
    fontSize: 12,
  },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  okText: {
    color: Colors.light.success,
    fontSize: 14,
    fontWeight: '600',
  },
  gapList: {
    gap: 8,
  },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gapLabel: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  gapHint: {
    color: Colors.light.secondary,
    fontSize: 13,
    flex: 1,
  },
});