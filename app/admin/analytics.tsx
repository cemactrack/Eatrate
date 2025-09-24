import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Store,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function AnalyticsDashboard() {
  const insets = useSafeAreaInsets();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const analyticsQuery = trpc.admin.settings.analytics.useQuery({ timeRange });

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ] as const;

  const renderMetricCard = (
    title: string,
    value: string | number,
    change: number,
    icon: React.ReactNode,
    color: string
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View style={styles.changeContainer}>
          {change >= 0 ? (
            <TrendingUp size={16} color="#10b981" />
          ) : (
            <TrendingDown size={16} color="#ef4444" />
          )}
          <Text style={[styles.changeText, { color: change >= 0 ? '#10b981' : '#ef4444' }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );

  const renderChartPlaceholder = (title: string, height: number) => (
    <View style={[styles.chartContainer, { height }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartPlaceholder}>
        <BarChart3 size={48} color={Colors.light.tabIconDefault} />
        <Text style={styles.chartPlaceholderText}>Chart visualization would go here</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeContainer}>
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
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {analyticsQuery.data && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'Total Users',
                analyticsQuery.data.users.total.toLocaleString(),
                analyticsQuery.data.users.growth,
                <Users size={24} color={Colors.light.tint} />,
                Colors.light.tint
              )}
              {renderMetricCard(
                'Active Users',
                analyticsQuery.data.users.active.toLocaleString(),
                analyticsQuery.data.users.activeGrowth,
                <Activity size={24} color="#10b981" />,
                '#10b981'
              )}
              {renderMetricCard(
                'Total Posts',
                analyticsQuery.data.posts.total.toLocaleString(),
                analyticsQuery.data.posts.growth,
                <MessageSquare size={24} color="#8b5cf6" />,
                '#8b5cf6'
              )}
              {renderMetricCard(
                'Restaurants',
                analyticsQuery.data.restaurants.total.toLocaleString(),
                analyticsQuery.data.restaurants.growth,
                <Store size={24} color="#f59e0b" />,
                '#f59e0b'
              )}
            </View>

            {/* Engagement Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Engagement Overview</Text>
              <View style={styles.engagementGrid}>
                <View style={styles.engagementCard}>
                  <Text style={styles.engagementValue}>
                    {analyticsQuery.data.engagement.avgSessionDuration}
                  </Text>
                  <Text style={styles.engagementLabel}>Avg Session Duration</Text>
                </View>
                <View style={styles.engagementCard}>
                  <Text style={styles.engagementValue}>
                    {analyticsQuery.data.engagement.postsPerUser.toFixed(1)}
                  </Text>
                  <Text style={styles.engagementLabel}>Posts per User</Text>
                </View>
                <View style={styles.engagementCard}>
                  <Text style={styles.engagementValue}>
                    {analyticsQuery.data.engagement.likesPerPost.toFixed(1)}
                  </Text>
                  <Text style={styles.engagementLabel}>Likes per Post</Text>
                </View>
                <View style={styles.engagementCard}>
                  <Text style={styles.engagementValue}>
                    {analyticsQuery.data.engagement.commentsPerPost.toFixed(1)}
                  </Text>
                  <Text style={styles.engagementLabel}>Comments per Post</Text>
                </View>
              </View>
            </View>

            {/* Charts */}
            {renderChartPlaceholder('User Growth Over Time', 250)}
            {renderChartPlaceholder('Post Activity by Day', 200)}
            {renderChartPlaceholder('Top Cuisines', 200)}

            {/* Top Performers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              
              <View style={styles.topPerformersContainer}>
                <Text style={styles.subsectionTitle}>Most Active Users</Text>
                {analyticsQuery.data.topUsers.map((user, index) => (
                  <View key={user.id} style={styles.topPerformerItem}>
                    <Text style={styles.topPerformerRank}>#{index + 1}</Text>
                    <Text style={styles.topPerformerName}>{user.name}</Text>
                    <Text style={styles.topPerformerValue}>{user.posts} posts</Text>
                  </View>
                ))}
              </View>

              <View style={styles.topPerformersContainer}>
                <Text style={styles.subsectionTitle}>Most Popular Restaurants</Text>
                {analyticsQuery.data.topRestaurants.map((restaurant, index) => (
                  <View key={restaurant.id} style={styles.topPerformerItem}>
                    <Text style={styles.topPerformerRank}>#{index + 1}</Text>
                    <Text style={styles.topPerformerName}>{restaurant.name}</Text>
                    <Text style={styles.topPerformerValue}>{restaurant.reviews} reviews</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Revenue Metrics (if applicable) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Metrics</Text>
              <View style={styles.platformMetricsGrid}>
                <View style={styles.platformMetricCard}>
                  <DollarSign size={24} color="#10b981" />
                  <Text style={styles.platformMetricValue}>
                    ${analyticsQuery.data.revenue?.total.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.platformMetricLabel}>Total Revenue</Text>
                </View>
                <View style={styles.platformMetricCard}>
                  <Calendar size={24} color="#8b5cf6" />
                  <Text style={styles.platformMetricValue}>
                    {analyticsQuery.data.retention?.rate || '0'}%
                  </Text>
                  <Text style={styles.platformMetricLabel}>User Retention</Text>
                </View>
                <View style={styles.platformMetricCard}>
                  <PieChart size={24} color="#f59e0b" />
                  <Text style={styles.platformMetricValue}>
                    {analyticsQuery.data.conversion?.rate || '0'}%
                  </Text>
                  <Text style={styles.platformMetricLabel}>Conversion Rate</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {analyticsQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  timeRangeContainer: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
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
  scrollView: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  metricCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  engagementCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
  },
  topPerformersContainer: {
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  topPerformerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topPerformerRank: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    width: 30,
  },
  topPerformerName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
  },
  topPerformerValue: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  platformMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  platformMetricCard: {
    width: (width - 64) / 3,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  platformMetricLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});