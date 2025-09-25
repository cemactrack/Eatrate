import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Clock, Users, MapPin, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

import { useSettings } from '@/providers/SettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Reservation } from '@/types/restaurant';

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    userId: 'user1',
    restaurantId: 'rest1',
    restaurant: {
      id: 'rest1',
      name: 'Le Beau Restaurant',
      cuisine: 'French',
      rating: 4.8,
      reviewCount: 245,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      address: 'Bonanjo, Douala, Cameroon',
      priceRange: '$$$',
      isOpen: true,
      tags: ['Fine Dining', 'Romantic'],
    },
    date: '2024-02-15',
    time: '19:30',
    partySize: 2,
    specialRequests: 'Window table for anniversary dinner',
    status: 'confirmed',
    confirmationCode: 'RES-2024-001',
    createdAt: '2024-02-10T14:30:00Z',
  },
  {
    id: '2',
    userId: 'user1',
    restaurantId: 'rest2',
    restaurant: {
      id: 'rest2',
      name: 'Chez Mama African Cuisine',
      cuisine: 'African',
      rating: 4.6,
      reviewCount: 189,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      address: 'Bastos, Yaoundé, Cameroon',
      priceRange: '$$',
      isOpen: true,
      tags: ['Traditional', 'Family-friendly'],
    },
    date: '2024-02-20',
    time: '13:00',
    partySize: 4,
    status: 'pending',
    confirmationCode: 'RES-2024-002',
    createdAt: '2024-02-12T09:15:00Z',
  },
];

interface ReservationItemProps {
  reservation: Reservation;
  onPress: () => void;
  onCancel: (reservationId: string) => void;
  onCall: (phone: string) => void;
}

const ReservationItem = React.memo(function ReservationItem({ 
  reservation, 
  onPress, 
  onCancel, 
  onCall 
}: ReservationItemProps) {
  const { colors } = useSettings();
  
  const getStatusColor = () => {
    switch (reservation.status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#6B7280';
      default: return colors.secondary;
    }
  };
  
  const getStatusIcon = () => {
    switch (reservation.status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return AlertCircle;
      case 'cancelled': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };
  
  const StatusIcon = getStatusIcon();
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const canCancel = reservation.status === 'confirmed' || reservation.status === 'pending';
  const isPast = new Date(`${reservation.date}T${reservation.time}`) < new Date();
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.reservationItem}>
      <View style={[styles.reservationCard, { backgroundColor: colors.card }]}>
        <Image source={{ uri: reservation.restaurant.image }} style={styles.restaurantImage} />
        
        <View style={styles.reservationContent}>
          <View style={styles.reservationHeader}>
            <Text style={[styles.restaurantName, { color: colors.text }]}>
              {reservation.restaurant.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <StatusIcon size={12} color="white" />
              <Text style={styles.statusText}>
                {reservation.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.restaurantCuisine, { color: colors.secondary }]}>
            {reservation.restaurant.cuisine} • {reservation.restaurant.address}
          </Text>
          
          <View style={styles.reservationDetails}>
            <View style={styles.detailItem}>
              <Calendar size={16} color={colors.tint} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {formatDate(reservation.date)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={16} color={colors.tint} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {formatTime(reservation.time)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Users size={16} color={colors.tint} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}
              </Text>
            </View>
          </View>
          
          <View style={styles.confirmationCode}>
            <Text style={[styles.confirmationText, { color: colors.secondary }]}>
              Confirmation: {reservation.confirmationCode}
            </Text>
          </View>
          
          {reservation.specialRequests && (
            <View style={styles.specialRequests}>
              <Text style={[styles.specialRequestsLabel, { color: colors.secondary }]}>Special Requests:</Text>
              <Text style={[styles.specialRequestsText, { color: colors.text }]}>
                {reservation.specialRequests}
              </Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => onCall('+237123456789')}
              style={[styles.actionButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
              testID={`call-restaurant-${reservation.id}`}
            >
              <Phone size={16} color={colors.tint} />
              <Text style={[styles.actionButtonText, { color: colors.tint }]}>Call</Text>
            </TouchableOpacity>
            
            {canCancel && !isPast && (
              <TouchableOpacity
                onPress={() => onCancel(reservation.id)}
                style={[styles.actionButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                testID={`cancel-reservation-${reservation.id}`}
              >
                <XCircle size={16} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ReservationsScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isLoading] = useState<boolean>(false);
  
  const filteredReservations = reservations.filter(reservation => {
    const reservationDate = new Date(`${reservation.date}T${reservation.time}`);
    const now = new Date();
    
    switch (selectedFilter) {
      case 'upcoming':
        return reservationDate >= now && (reservation.status === 'confirmed' || reservation.status === 'pending');
      case 'past':
        return reservationDate < now || reservation.status === 'completed' || reservation.status === 'cancelled';
      default:
        return true;
    }
  });
  
  const handleReservationPress = useCallback((reservation: Reservation) => {
    console.log('[Reservations] Reservation pressed:', reservation.confirmationCode);
    router.push(`/restaurants/${reservation.restaurantId}`);
  }, [router]);
  
  const handleCancelReservation = useCallback(async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;
    
    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel your reservation at ${reservation.restaurant.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setReservations(prev => prev.map(r => 
                r.id === reservationId 
                  ? { ...r, status: 'cancelled' as const }
                  : r
              ));
              console.log('[Reservations] Cancelled reservation:', reservationId);
            } catch (error) {
              console.error('[Reservations] Failed to cancel reservation:', error);
            }
          },
        },
      ]
    );
  }, [reservations]);
  
  const handleCallRestaurant = useCallback((phone: string) => {
    console.log('[Reservations] Calling restaurant:', phone);
    Alert.alert('Call Restaurant', `Would call ${phone}`);
  }, []);
  
  const filterButtons = [
    { 
      key: 'all' as const, 
      label: 'All', 
      count: reservations.length 
    },
    { 
      key: 'upcoming' as const, 
      label: 'Upcoming', 
      count: reservations.filter(r => {
        const reservationDate = new Date(`${r.date}T${r.time}`);
        return reservationDate >= new Date() && (r.status === 'confirmed' || r.status === 'pending');
      }).length 
    },
    { 
      key: 'past' as const, 
      label: 'Past', 
      count: reservations.filter(r => {
        const reservationDate = new Date(`${r.date}T${r.time}`);
        return reservationDate < new Date() || r.status === 'completed' || r.status === 'cancelled';
      }).length 
    },
  ];
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Loading reservations..." />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'My Reservations',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
              testID={`filter-${filter.key}`}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedFilter === filter.key ? 'white' : colors.text,
                  },
                ]}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.3)' : colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      {
                        color: selectedFilter === filter.key ? 'white' : colors.tint,
                      },
                    ]}
                  >
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {filteredReservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No reservations found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            {selectedFilter === 'all' 
              ? 'You haven\'t made any reservations yet. Start exploring restaurants!'
              : `No ${selectedFilter} reservations`
            }
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/restaurants')}
            style={[styles.exploreButton, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.exploreButtonText}>Find Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={({ item }) => (
            <ReservationItem
              reservation={item}
              onPress={() => handleReservationPress(item)}
              onCancel={handleCancelReservation}
              onCall={handleCallRestaurant}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  reservationItem: {
    marginBottom: 16,
  },
  reservationCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  reservationContent: {
    padding: 16,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  restaurantCuisine: {
    fontSize: 14,
    marginBottom: 16,
  },
  reservationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmationCode: {
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  specialRequests: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});