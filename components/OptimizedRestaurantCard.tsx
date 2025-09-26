import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MapPin, Star, DollarSign } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useStableCallback } from '@/utils/performance';
import { Restaurant } from '@/types/restaurant';

interface OptimizedRestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurantId: string) => void;
  showDistance?: boolean;
  compact?: boolean;
}

const OptimizedRestaurantCard: React.FC<OptimizedRestaurantCardProps> = ({
  restaurant,
  onPress,
  showDistance = true,
  compact = false,
}) => {
  const { colors } = useSettings();
  
  // Stable callback to prevent unnecessary re-renders
  const handlePress = useStableCallback(() => onPress(restaurant.id));
  
  // Memoized styles
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);
  
  // Memoized formatted data
  const formattedData = useMemo(() => ({
    rating: restaurant.rating?.toFixed(1) || '0.0',
    priceRange: '$'.repeat(restaurant.priceRange || 1),
    distance: restaurant.distance ? `${restaurant.distance.toFixed(1)}km` : null,
    cuisineText: restaurant.cuisine?.slice(0, 2).join(', ') || 'Restaurant',
    imageUri: restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  }), [restaurant]);
  
  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      android_ripple={{ color: colors.accent }}
      testID={`restaurant-${restaurant.id}`}
    >
      {/* Image */}
      <Image
        source={{ uri: formattedData.imageUri }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={styles.rating}>{formattedData.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.cuisine} numberOfLines={1}>
          {formattedData.cuisineText}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <MapPin size={12} color={colors.secondary} />
            <Text style={styles.location} numberOfLines={1}>
              {restaurant.location?.address || 'Location not available'}
            </Text>
          </View>
          
          <View style={styles.metaContainer}>

            
            <View style={styles.metaItem}>
              <DollarSign size={12} color={colors.secondary} />
              <Text style={styles.metaText}>{formattedData.priceRange}</Text>
            </View>
            
            {showDistance && formattedData.distance && (
              <Text style={styles.distance}>{formattedData.distance}</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: any, compact: boolean) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: compact ? 12 : 16,
    marginVertical: compact ? 4 : 8,
    marginHorizontal: compact ? 8 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: compact ? 120 : 160,
  },
  content: {
    padding: compact ? 12 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: compact ? 16 : 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  cuisine: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 12,
  },
  footer: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 12,
    color: colors.secondary,
    flex: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  distance: {
    fontSize: 12,
    color: colors.tint,
    fontWeight: '600',
  },
});

// Memoize the component with custom comparison
export default memo(OptimizedRestaurantCard, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.restaurant.id === nextProps.restaurant.id &&
    prevProps.restaurant.rating === nextProps.restaurant.rating &&
    prevProps.restaurant.name === nextProps.restaurant.name &&
    prevProps.compact === nextProps.compact &&
    prevProps.showDistance === nextProps.showDistance
  );
});