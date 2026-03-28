import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Eye, Heart, Users, Calendar, Trophy, Target, BarChart3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const MetricCard = React.memo(function MetricCard({ icon, title, value, change, changeType }: MetricCardProps) {
  const { width } = Dimensions.get('window');
  
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return Colors.light.success;
      case 'negative': return Colors.light.error;
      default: return Colors.light.secondary;
    }
  };

  return (
    <View style={[styles.metricCard, { width: (width - 44) / 2 }]}>
      <View style={styles.metricHeader}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {change && (
        <Text style={[styles.metricChange, { color: getChangeColor() }]}>
          {change}
        </Text>
      )}
    </View>
  );
});

export default function ProfileAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Mock analytics data since we don't have real analytics yet
  const analyticsData = useMemo(() => ({
    profileViews: {
      total: Math.floor(Math.random() * 50000) + 10000,
      change: '+12.5%',
      changeType: 'positive' as const
    },
    postEngagement: {
      total: Math.floor(Math.random() * 10000) + 2000,
      change: '+8.3%',
      changeType: 'positive' as const
    },
    followers: {
      total: Math.floor(Math.random() * 5000) + 500,
      change: '+15.2%',
      changeType: 'positive' as const
    },
    avgRating: {
      total: (4.2 + Math.random() * 0.8).toFixed(1),
      change: '+0.3',
      changeType: 'positive' as const
    },
    topPosts: [
      { id: '1', title: 'Amazing pasta at Luigi\'s', views: 1250, likes: 89 },
      { id: '2', title: 'Street food adventure', views: 980, likes: 67 },
      { id: '3', title: 'Fine dining experience', views: 756, likes: 45 }
    ],
    demographics: {
      topCities: ['Douala', 'Yaounde', 'Buea'],
      ageGroups: ['25-34 (45%)', '18-24 (30%)', '35-44 (25%)']
    },
    engagement: {
      bestTime: '7-9 PM',
      bestDay: 'Friday',
      avgSessionTime: '4m 32s'
    }
  }), []);

  const timeRangeOptions = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' }
  ];

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Profile Analytics' }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeRangeButton,
                timeRange === option.key && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(option.key as '7d' | '30d' | '90d')}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === option.key && styles.timeRangeTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<Eye size={20} color={Colors.light.tint} />}
            title="Profile Views"
            value={analyticsData.profileViews.total.toLocaleString()}
            change={analyticsData.profileViews.change}
            changeType={analyticsData.profileViews.changeType}
          />
          <MetricCard
            icon={<Heart size={20} color={Colors.light.error} />}
            title="Post Engagement"
            value={analyticsData.postEngagement.total.toLocaleString()}
            change={analyticsData.postEngagement.change}
            changeType={analyticsData.postEngagement.changeType}
          />
          <MetricCard
            icon={<Users size={20} color={Colors.light.success} />}
            title="New Followers"
            value={analyticsData.followers.total.toLocaleString()}
            change={analyticsData.followers.change}
            changeType={analyticsData.followers.changeType}
          />
          <MetricCard
            icon={<Trophy size={20} color={Colors.light.warning} />}
            title="Avg Rating"
            value={`${analyticsData.avgRating.total}/5`}
            change={analyticsData.avgRating.change}
            changeType={analyticsData.avgRating.changeType}
          />
        </View>

        {/* Top Performing Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Posts</Text>
          {analyticsData.topPosts.map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={styles.topPostItem}
              onPress={() => router.push(`/posts/${post.id}`)}
            >
              <View style={styles.topPostRank}>
                <Text style={styles.topPostRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topPostContent}>
                <Text style={styles.topPostTitle}>{post.title}</Text>
                <View style={styles.topPostStats}>
                  <View style={styles.topPostStat}>
                    <Eye size={14} color={Colors.light.secondary} />
                    <Text style={styles.topPostStatText}>{post.views}</Text>
                  </View>
                  <View style={styles.topPostStat}>
                    <Heart size={14} color={Colors.light.secondary} />
                    <Text style={styles.topPostStatText}>{post.likes}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Audience Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience Insights</Text>
          
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Top Cities</Text>
            <View style={styles.insightList}>
              {analyticsData.demographics.topCities.map((city, index) => (
                <View key={city} style={styles.insightItem}>
                  <Text style={styles.insightRank}>{index + 1}</Text>
                  <Text style={styles.insightText}>{city}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Age Groups</Text>
            <View style={styles.insightList}>
              {analyticsData.demographics.ageGroups.map((group, index) => (
                <View key={group} style={styles.insightItem}>
                  <Text style={styles.insightText}>{group}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Engagement Patterns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement Patterns</Text>
          
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <Calendar size={20} color={Colors.light.tint} />
              <Text style={styles.engagementTitle}>Best Day</Text>
              <Text style={styles.engagementValue}>{analyticsData.engagement.bestDay}</Text>
            </View>
            <View style={styles.engagementCard}>
              <Target size={20} color={Colors.light.success} />
              <Text style={styles.engagementTitle}>Best Time</Text>
              <Text style={styles.engagementValue}>{analyticsData.engagement.bestTime}</Text>
            </View>
            <View style={styles.engagementCard}>
              <BarChart3 size={20} color={Colors.light.warning} />
              <Text style={styles.engagementTitle}>Avg Session</Text>
              <Text style={styles.engagementValue}>{analyticsData.engagement.avgSessionTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginTop: 12,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  timeRangeTextActive: {
    color: 'white',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondary,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  topPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  topPostRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topPostRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  topPostContent: {
    flex: 1,
  },
  topPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  topPostStats: {
    flexDirection: 'row',
    gap: 16,
  },
  topPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topPostStatText: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  insightCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  insightList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightRank: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.tint,
    width: 20,
  },
  insightText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  engagementGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  engagementCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  engagementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  engagementValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});