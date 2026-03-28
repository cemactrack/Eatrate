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
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Download,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function ClaimsManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const claimsQuery = trpc.admin.claims.list.useQuery({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
    offset: 0,
  });

  const updateClaimMutation = trpc.admin.claims.update.useMutation({
    onSuccess: () => {
      claimsQuery.refetch();
    },
  });

  const handleClaimUpdate = (claimId: string, status: 'approved' | 'rejected', reason?: string) => {
    const actionText = status === 'approved' ? 'approve' : 'reject';
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Claim`,
      `Are you sure you want to ${actionText} this restaurant claim?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateClaimMutation.mutate({
              claimId,
              status,
              adminNotes: reason || `Admin ${actionText}`,
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#10b981" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'rejected': return <XCircle size={16} color="#ef4444" />;
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
            placeholder="Search claims..."
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
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
        {claimsQuery.data?.claims.map((claim) => (
          <View key={claim.id} style={styles.claimCard}>
            <View style={styles.claimHeader}>
              <Image source={{ uri: claim.restaurant.image }} style={styles.restaurantImage} />
              <View style={styles.claimInfo}>
                <Text style={styles.restaurantName}>{claim.restaurant.name}</Text>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color={Colors.light.tabIconDefault} />
                  <Text style={styles.locationText}>{claim.restaurant.location}</Text>
                </View>
                <View style={styles.claimantInfo}>
                  <User size={14} color={Colors.light.tabIconDefault} />
                  <Text style={styles.claimantText}>
                    Claimed by {claim.claimant.name}
                  </Text>
                </View>
                <View style={styles.dateInfo}>
                  <Calendar size={14} color={Colors.light.tabIconDefault} />
                  <Text style={styles.dateText}>
                    {new Date(claim.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.claimActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) }]}>
                  {getStatusIcon(claim.status)}
                  <Text style={styles.statusText}>{claim.status}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={16} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.claimDescription}>
              <Text style={styles.descriptionTitle}>Claim Details:</Text>
              <Text style={styles.descriptionText}>{claim.description}</Text>
            </View>

            <View style={styles.documentsSection}>
              <Text style={styles.documentsTitle}>Supporting Documents:</Text>
              <View style={styles.documentsContainer}>
                {claim.documents.map((doc, index) => (
                  <TouchableOpacity key={index} style={styles.documentItem}>
                    <FileText size={16} color={Colors.light.tint} />
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <TouchableOpacity style={styles.downloadButton}>
                      <Download size={14} color={Colors.light.tabIconDefault} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.claimFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/restaurants/${claim.restaurant.id}`)}
              >
                <Eye size={16} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>View Restaurant</Text>
              </TouchableOpacity>

              {claim.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleClaimUpdate(claim.id, 'approved')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleClaimUpdate(claim.id, 'rejected')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {claimsQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading claims...</Text>
          </View>
        )}

        {claimsQuery.data?.claims.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No claims found</Text>
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
  claimCard: {
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
  claimHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  claimInfo: {
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
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  claimantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  claimantText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  claimActions: {
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
  claimDescription: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  documentsSection: {
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  documentsContainer: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  downloadButton: {
    padding: 4,
  },
  claimFooter: {
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