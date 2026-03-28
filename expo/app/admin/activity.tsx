import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Users,
  Store,
  MessageSquare,
  Flag,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  BarChart3,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
import type { AdminActivity } from '@/types/admin';

const { width } = Dimensions.get('window');

const getActionIcon = (targetType: AdminActivity['target']['type']) => {
  switch (targetType) {
    case 'user': return Users;
    case 'restaurant': return Store;
    case 'post': return MessageSquare;
    case 'comment': return MessageSquare;
    case 'claim': return Flag;
    default: return Activity;
  }
};

const getActionColor = (action: string) => {
  if (action.toLowerCase().includes('suspend') || action.toLowerCase().includes('ban')) {
    return '#ef4444';
  }
  if (action.toLowerCase().includes('approve') || action.toLowerCase().includes('verify')) {
    return '#10b981';
  }
  if (action.toLowerCase().includes('flag') || action.toLowerCase().includes('report')) {
    return '#f59e0b';
  }
  return Colors.light.tint;
};

export default function AdminActivityScreen() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'restaurant' | 'post' | 'comment' | 'claim'>('all');
  const { hasPermission, adminUser } = useAdmin();

  const activitiesQuery = trpc.admin.activity.list.useQuery({
    limit: 50,
    targetType: filterType === 'all' ? undefined : filterType,
  });

  const statsQuery = trpc.admin.activity.stats.useQuery({ timeRange });

  const filteredActivities = useMemo(() => {
    if (!activitiesQuery.data?.activities) return [];
    return activitiesQuery.data.activities;
  }, [activitiesQuery.data?.activities]);

  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ] as const;

  const filterOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'user', label: 'User Actions' },
    { value: 'restaurant', label: 'Restaurant Actions' },
    { value: 'post', label: 'Post Actions' },
    { value: 'comment', label: 'Comment Actions' },
    { value: 'claim', label: 'Claim Actions' },
  ] as const;

  if (!hasPermission('view_analytics')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermission}>
          <Activity size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noPermissionText}>
            You don't have permission to view admin activity.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Activity</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Download size={16} color={Colors.light.tint} />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Time Range Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeContainer}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeRangeButton,
                  timeRange === option.value && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange(option.value)}
              >
                <Text
                  style={[
                    styles.timeRangeButtonText,
                    timeRange === option.value && styles.timeRangeButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Stats */}
        {statsQuery.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Activity size={24} color={Colors.light.tint} />
                <Text style={styles.statNumber}>{statsQuery.data.totalActions}</Text>
                <Text style={styles.statLabel}>Total Actions</Text>
              </View>
              <View style={styles.statCard}>
                <Users size={24} color='#10b981' />
                <Text style={styles.statNumber}>{statsQuery.data.actionsByType.user}</Text>
                <Text style={styles.statLabel}>User Actions</Text>
              </View>
              <View style={styles.statCard}>
                <Store size={24} color='#f59e0b' />
                <Text style={styles.statNumber}>{statsQuery.data.actionsByType.restaurant}</Text>
                <Text style={styles.statLabel}>Restaurant Actions</Text>
              </View>
              <View style={styles.statCard}>
                <MessageSquare size={24} color='#8b5cf6' />
                <Text style={styles.statNumber}>
                  {statsQuery.data.actionsByType.post + statsQuery.data.actionsByType.comment}
                </Text>
                <Text style={styles.statLabel}>Content Actions</Text>
              </View>
            </View>

            {/* Top Admins */}
            <View style={styles.topAdminsContainer}>
              <Text style={styles.subsectionTitle}>Most Active Admins</Text>
              {statsQuery.data.topAdmins.map((admin, index) => (
                <View key={admin.name} style={styles.topAdminItem}>
                  <Text style={styles.topAdminRank}>#{index + 1}</Text>
                  <Text style={styles.topAdminName}>{admin.name}</Text>
                  <Text style={styles.topAdminCount}>{admin.count} actions</Text>
                </View>
              ))}
            </View>

            {/* Activity Chart Placeholder */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Activity Over Time</Text>
              <View style={styles.chartPlaceholder}>
                <BarChart3 size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.chartPlaceholderText}>
                  Activity chart visualization would go here
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Activities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    filterType === option.value && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterType(option.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterType === option.value && styles.filterButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {activitiesQuery.isLoading ? (
            <View style={styles.loading}>
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={styles.empty}>
              <Activity size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyText}>No activities found</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {filteredActivities.map((activity) => {
                const IconComponent = getActionIcon(activity.target.type);
                const actionColor = getActionColor(activity.action);
                
                return (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                      <View style={[styles.activityIcon, { backgroundColor: actionColor + '20' }]}>
                        <IconComponent size={20} color={actionColor} />
                      </View>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityAdmin}>{activity.adminName}</Text>
                        <Text style={styles.activityTime}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.activityAction}>{activity.action}</Text>
                    <Text style={styles.activityTarget}>
                      Target: {activity.target.name} ({activity.target.type})
                    </Text>
                    
                    {activity.details && (
                      <Text style={styles.activityDetails}>{activity.details}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  topAdminsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topAdminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topAdminRank: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    width: 30,
  },
  topAdminName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
  },
  topAdminCount: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loading: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 16,
  },
  activitiesList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityMeta: {
    flex: 1,
  },
  activityAdmin: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  activityTarget: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  activityDetails: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 16,
  },
});