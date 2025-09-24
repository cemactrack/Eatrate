import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Dish } from '@/types/restaurant';
import StarRating from './StarRating';
import Colors from '@/constants/colors';

interface DishCardProps {
  dish: Dish;
  onPress: () => void;
}

export default function DishCard({ dish, onPress }: DishCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: dish.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {dish.name}
          </Text>
          <Text style={styles.price}>${dish.price}</Text>
        </View>
        
        <Text style={styles.restaurant} numberOfLines={1}>
          {dish.restaurant}
        </Text>
        
        <View style={styles.ratingContainer}>
          <StarRating rating={dish.rating} size={12} showEmpty={false} />
          <Text style={styles.rating}>{dish.rating}</Text>
          <Text style={styles.reviewCount}>({dish.reviewCount})</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {dish.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.light.border,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  restaurant: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginLeft: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.light.secondary,
    lineHeight: 16,
  },
});