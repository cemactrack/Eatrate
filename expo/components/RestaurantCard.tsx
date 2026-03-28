import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock, Heart } from 'lucide-react-native';
import { Restaurant } from '@/types/restaurant';
import StarRating from './StarRating';
import { useSettings } from '@/providers/SettingsProvider';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compact?: boolean;
}

const RestaurantCard = React.memo(function RestaurantCard({ 
  restaurant, 
  onPress, 
  isFavorite = false, 
  onToggleFavorite, 
  compact = false 
}: RestaurantCardProps) {
  const { colors } = useSettings();
  
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }, compact && styles.compactCard]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.image }} style={[styles.image, compact && styles.compactImage, { backgroundColor: colors.border }]} />
        {onToggleFavorite && (
          <TouchableOpacity 
            style={[styles.favoriteButton, { backgroundColor: colors.background }]} 
            onPress={onToggleFavorite}
          >
            <Heart 
              size={16} 
              color={isFavorite ? colors.error : colors.secondary} 
              fill={isFavorite ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }, compact && styles.compactName]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={[styles.priceContainer, { backgroundColor: colors.accent }]}>
            <Text style={[styles.price, { color: colors.warning }]}>{restaurant.priceRange}</Text>
          </View>
        </View>
        
        <Text style={[styles.cuisine, { color: colors.secondary }, compact && styles.compactCuisine]}>{restaurant.cuisine}</Text>
        
        <View style={styles.ratingContainer}>
          <StarRating rating={restaurant.rating} size={compact ? 12 : 14} showEmpty={false} />
          <Text style={[styles.rating, { color: colors.text }, compact && styles.compactRating]}>{restaurant.rating}</Text>
          <Text style={[styles.reviewCount, { color: colors.secondary }, compact && styles.compactReviewCount]}>({restaurant.reviewCount})</Text>
        </View>
        
        {!compact && (
          <View style={styles.footer}>
            <View style={styles.locationContainer}>
              <MapPin size={12} color={colors.secondary} />
              <Text style={[styles.distance, { color: colors.secondary }]}>{restaurant.distance || 'Near you'}</Text>
            </View>
            
            <View style={[styles.statusContainer, { backgroundColor: restaurant.isOpen ? colors.success : colors.secondary }]}>
              <Clock size={10} color="white" />
              <Text style={styles.status}>{restaurant.isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
        )}
        
        {!compact && (
          <View style={styles.tagsContainer}>
            {restaurant.tags.slice(0, 3).map((tag, index) => (
              <View key={`tag-${restaurant.id}-${tag}-${index}`} style={[styles.tag, { backgroundColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.secondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default RestaurantCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  compactCard: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  compactImage: {
    height: 120,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  compactName: {
    fontSize: 16,
  },
  priceContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  cuisine: {
    fontSize: 14,
    marginBottom: 8,
  },
  compactCuisine: {
    fontSize: 12,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  compactRating: {
    fontSize: 12,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  compactReviewCount: {
    fontSize: 12,
    marginLeft: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});