import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  Flag,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function ReportsManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'restaurant' | 'post' | 'comment'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const reportsQuery = trpc.admin.moderation.reports.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
    offset: 0,
  });

  const updateReportMutation = trpc.admin.moderation.updateReport.useMutation({
    onSuccess: () => {
      reportsQuery.refetch();
    },
  });

  const handleReportUpdate = (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    const actionText = status === 'reviewed' ? 'mark as reviewed' : status === 'resolved' ? 'resolve' : 'dismiss';
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Report`,
      `Are you sure you want to ${actionText} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateReportMutation.mutate({
              reportId,
              status,
              adminNotes: `Admin ${actionText}`,
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'reviewed': return '#8b5cf6';
      case 'pending': return '#f59e0b';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle size={16} color="#10b981" />;
      case 'reviewed': return <Eye size={16} color="#8b5cf6" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'dismissed': return <XCircle size={16} color="#6b7280" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User size={16} color={Colors.light.tabIconDefault} />;
      case 'restaurant': return <FileText size={16} color={Colors.light.tabIconDefault} />;
      case 'post': return <MessageSquare size={16} color={Colors.light.tabIconDefault} />;
      case 'comment': return <MessageSquare size={16} color={Colors.light.tabIconDefault} />;
      default: return <Flag size={16} color={Colors.light.tabIconDefault} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#8b5cf6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.tabIconDefault} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
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
          <Text style={styles.filterSectionTitle}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((status) => (
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

          <Text style={styles.filterSectionTitle}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['all', 'user', 'restaurant', 'post', 'comment'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  typeFilter === type && styles.filterChipActive,
                ]}
                onPress={() => setTypeFilter(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    typeFilter === type && styles.filterChipTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {reportsQuery.data?.reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportTypeContainer}>
                {getTypeIcon(report.type)}
                <Text style={styles.reportType}>{report.type.toUpperCase()}</Text>
              </View>
              <View style={styles.reportMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor('high') }]}>
                  <AlertTriangle size={12} color="white" />
                  <Text style={styles.priorityText}>HIGH</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                  {getStatusIcon(report.status)}
                  <Text style={styles.statusText}>{report.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.reportContent}>
              <Text style={styles.reportReason}>{report.reason}</Text>
              {report.description && (
                <Text style={styles.reportDescription}>{report.description}</Text>
              )}
            </View>

            <View style={styles.reportDetails}>
              <View style={styles.reporterInfo}>
                <User size={14} color={Colors.light.tabIconDefault} />
                <Text style={styles.reporterText}>
                  Reported by {report.reporterName}
                </Text>
              </View>
              <View style={styles.dateInfo}>
                <Calendar size={14} color={Colors.light.tabIconDefault} />
                <Text style={styles.dateText}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.reportFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // Navigate to the reported content
                  if (report.type === 'post') {
                    router.push(`/posts/${report.targetId}`);
                  } else if (report.type === 'user') {
                    router.push(`/users/${report.targetId}`);
                  } else if (report.type === 'restaurant') {
                    router.push(`/restaurants/${report.targetId}`);
                  }
                }}
              >
                <Eye size={16} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>View Content</Text>
              </TouchableOpacity>

              {report.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.reviewButton]}
                    onPress={() => handleReportUpdate(report.id, 'reviewed')}
                  >
                    <Eye size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.reviewButtonText]}>Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleReportUpdate(report.id, 'resolved')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.resolveButtonText]}>Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleReportUpdate(report.id, 'dismissed')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.dismissButtonText]}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              )}

              {report.status === 'reviewed' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleReportUpdate(report.id, 'resolved')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.resolveButtonText]}>Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleReportUpdate(report.id, 'dismissed')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.dismissButtonText]}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {reportsQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {reportsQuery.data?.reports.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
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
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    marginBottom: 8,
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
    marginLeft: 6,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterText: {
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
  reportFooter: {
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
  reviewButton: {
    backgroundColor: '#8b5cf6',
  },
  reviewButtonText: {
    color: 'white',
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  resolveButtonText: {
    color: 'white',
  },
  dismissButton: {
    backgroundColor: '#6b7280',
  },
  dismissButtonText: {
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