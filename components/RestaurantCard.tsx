import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import { Restaurant } from '@/types/restaurant';
import StarRating from './StarRating';
import Colors from '@/constants/colors';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: restaurant.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{restaurant.priceRange}</Text>
          </View>
        </View>
        
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        
        <View style={styles.ratingContainer}>
          <StarRating rating={restaurant.rating} size={14} showEmpty={false} />
          <Text style={styles.rating}>{restaurant.rating}</Text>
          <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <MapPin size={12} color={Colors.light.secondary} />
            <Text style={styles.distance}>{restaurant.distance || 'Near you'}</Text>
          </View>
          
          <View style={[styles.statusContainer, { backgroundColor: restaurant.isOpen ? Colors.light.success : Colors.light.secondary }]}>
            <Clock size={10} color="white" />
            <Text style={styles.status}>{restaurant.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {restaurant.tags.slice(0, 3).map((tag, index) => (
            <View key={`tag-${restaurant.id}-${tag}-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
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
  image: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.border,
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
    color: Colors.light.text,
    flex: 1,
  },
  priceContainer: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  cuisine: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginLeft: 4,
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
    color: Colors.light.secondary,
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
    backgroundColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
});