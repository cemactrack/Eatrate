import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  size?: number;
  showEmpty?: boolean;
}

export default function StarRating({ rating, size = 16, showEmpty = true }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = showEmpty ? 5 - Math.ceil(rating) : 0;

  return (
    <View style={styles.container}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={`full-${index}`}
          size={size}
          color={Colors.light.warning}
          fill={Colors.light.warning}
        />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <View style={styles.halfStarContainer}>
          <Star
            size={size}
            color={Colors.light.border}
            fill={Colors.light.border}
          />
          <View style={[styles.halfStarOverlay, { width: size / 2 }]}>
            <Star
              size={size}
              color={Colors.light.warning}
              fill={Colors.light.warning}
            />
          </View>
        </View>
      )}
      
      {/* Empty stars */}
      {showEmpty && Array.from({ length: emptyStars }).map((_, index) => (
        <Star
          key={`empty-${index}`}
          size={size}
          color={Colors.light.border}
          fill="transparent"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfStarContainer: {
    position: 'relative',
  },
  halfStarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});