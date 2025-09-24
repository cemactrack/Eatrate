import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function RestaurantManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const restaurantsQuery = trpc.admin.restaurants.list.useQuery({
    search: searchQuery,
    status: statusFilter,
    limit: 20,
    offset: 0,
  });

  const updateRestaurantMutation = trpc.admin.restaurants.updateStatus.useMutation({
    onSuccess: () => {
      restaurantsQuery.refetch();
    },
  });

  const deleteRestaurantMutation = trpc.admin.restaurants.delete.useMutation({
    onSuccess: () => {
      restaurantsQuery.refetch();
    },
  });

  const handleStatusUpdate = (restaurantId: string, status: 'verified' | 'rejected') => {
    Alert.alert(
      'Update Restaurant Status',
      `Are you sure you want to ${status === 'verified' ? 'verify' : 'reject'} this restaurant?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateRestaurantMutation.mutate({ restaurantId, status });
          },
        },
      ]
    );
  };

  const handleDeleteRestaurant = (restaurantId: string, name: string) => {
    Alert.alert(
      'Delete Restaurant',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRestaurantMutation.mutate({ restaurantId, reason: 'Admin deletion' });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle size={16} color="#10b981" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'rejected': return <XCircle size={16} color="#ef4444" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.tabIconDefault} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.tabIconDefault}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'verified', 'pending', 'rejected'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {restaurantsQuery.data?.restaurants.map((restaurant) => (
          <View key={restaurant.id} style={styles.restaurantCard}>
            <View style={styles.restaurantHeader}>
              <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color={Colors.light.tabIconDefault} />
                  <Text style={styles.locationText}>{restaurant.location}</Text>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Star size={14} color="#f59e0b" />
                    <Text style={styles.statText}>{restaurant.rating}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Users size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.statText}>{restaurant.reviewsCount} reviews</Text>
                  </View>
                </View>
              </View>
              <View style={styles.restaurantActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(restaurant.status) }]}>
                  {getStatusIcon(restaurant.status)}
                  <Text style={styles.statusText}>{restaurant.status}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={16} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.restaurantFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/restaurants/${restaurant.id}`)}
              >
                <Eye size={16} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>

              {restaurant.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleStatusUpdate(restaurant.id, 'verified')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>Verify</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleStatusUpdate(restaurant.id, 'rejected')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/admin/restaurants/edit/${restaurant.id}`)}
              >
                <Edit size={16} color={Colors.light.tabIconDefault} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {restaurantsQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading restaurants...</Text>
          </View>
        )}

        {restaurantsQuery.data?.restaurants.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No restaurants found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  restaurantCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  restaurantActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  restaurantFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    color: 'white',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  rejectButtonText: {
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});