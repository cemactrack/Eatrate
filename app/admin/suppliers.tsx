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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Package,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function SupplierManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const suppliersQuery = trpc.admin.suppliers.list.useQuery({
    search: searchQuery,
    status: statusFilter,
    limit: 20,
    offset: 0,
  });

  const updateSupplierMutation = trpc.admin.suppliers.updateStatus.useMutation({
    onSuccess: () => {
      suppliersQuery.refetch();
    },
  });

  const deleteSupplierMutation = trpc.admin.suppliers.delete.useMutation({
    onSuccess: () => {
      suppliersQuery.refetch();
    },
  });

  const handleStatusUpdate = (supplierId: string, status: 'active' | 'suspended') => {
    Alert.alert(
      'Update Supplier Status',
      `Are you sure you want to ${status === 'active' ? 'activate' : 'suspend'} this supplier?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateSupplierMutation.mutate({ supplierId, status });
          },
        },
      ]
    );
  };

  const handleDeleteSupplier = (supplierId: string, name: string) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSupplierMutation.mutate({ supplierId, reason: 'Admin deletion' });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} color="#10b981" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'suspended': return <XCircle size={16} color="#ef4444" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.tabIconDefault} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers..."
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
            {(['all', 'active', 'pending', 'suspended'] as const).map((status) => (
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
        {suppliersQuery.data?.suppliers.map((supplier) => (
          <View key={supplier.id} style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Image source={{ uri: supplier.logo }} style={styles.supplierLogo} />
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <MapPin size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.contactText}>{supplier.location}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Phone size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.contactText}>{supplier.phone}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Mail size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.contactText}>{supplier.email}</Text>
                  </View>
                </View>
                <View style={styles.supplierStats}>
                  <View style={styles.statItem}>
                    <Package size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.statText}>{supplier.productsCount} products</Text>
                  </View>
                </View>
              </View>
              <View style={styles.supplierActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supplier.status) }]}>
                  {getStatusIcon(supplier.status)}
                  <Text style={styles.statusText}>{supplier.status}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={16} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.supplierDescription}>
              <Text style={styles.descriptionText}>{supplier.description}</Text>
            </View>

            <View style={styles.supplierCategories}>
              {supplier.categories.map((category, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>

            <View style={styles.supplierFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/suppliers/${supplier.id}`)}
              >
                <Eye size={16} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>

              {supplier.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleStatusUpdate(supplier.id, 'active')}
                >
                  <CheckCircle size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.approveButtonText]}>Activate</Text>
                </TouchableOpacity>
              )}

              {supplier.status === 'active' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.suspendButton]}
                  onPress={() => handleStatusUpdate(supplier.id, 'suspended')}
                >
                  <XCircle size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.suspendButtonText]}>Suspend</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/admin/suppliers/edit/${supplier.id}`)}
              >
                <Edit size={16} color={Colors.light.tabIconDefault} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteSupplier(supplier.id, supplier.name)}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {suppliersQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading suppliers...</Text>
          </View>
        )}

        {suppliersQuery.data?.suppliers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No suppliers found</Text>
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
  supplierCard: {
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
  supplierHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  supplierLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 6,
  },
  supplierStats: {
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
  supplierActions: {
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
  supplierDescription: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  supplierCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  supplierFooter: {
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
  suspendButton: {
    backgroundColor: '#ef4444',
  },
  suspendButtonText: {
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