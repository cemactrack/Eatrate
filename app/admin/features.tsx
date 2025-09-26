import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

type FeatureStatus = 'production' | 'partial' | 'not-implemented';

interface Feature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  category: string;
  completionPercentage: number;
  dependencies?: string[];
  notes?: string;
}

const FEATURES: Feature[] = [
  // Authentication & Access
  {
    id: 'auth-signup-login',
    name: 'User Sign-up/Login',
    description: 'Email, phone, and social login authentication',
    status: 'production',
    category: 'Authentication & Access',
    completionPercentage: 100,
  },
  {
    id: 'auth-roles',
    name: 'Role-based Authentication',
    description: 'Users, Restaurant Owners, Suppliers, Admins access control',
    status: 'production',
    category: 'Authentication & Access',
    completionPercentage: 100,
  },
  
  // Restaurant Features
  {
    id: 'restaurant-listings',
    name: 'Multi-city Restaurant Listings',
    description: 'Restaurant listings across Douala, Yaounde, Buea, Limbe',
    status: 'production',
    category: 'Restaurant Features',
    completionPercentage: 100,
  },
  {
    id: 'restaurant-profiles',
    name: 'Detailed Restaurant Profiles',
    description: 'Menus, ratings, contact info, location, photos',
    status: 'production',
    category: 'Restaurant Features',
    completionPercentage: 100,
  },
  {
    id: 'restaurant-cuisine-tags',
    name: 'Cuisine Tagging',
    description: 'African, Asian, Vegan, Fast Food categorization',
    status: 'production',
    category: 'Restaurant Features',
    completionPercentage: 100,
  },
  {
    id: 'restaurant-claim-verify',
    name: 'Claim & Verify Ownership',
    description: 'Restaurant owners can claim and verify their establishments',
    status: 'production',
    category: 'Restaurant Features',
    completionPercentage: 100,
  },
  {
    id: 'restaurant-menu-management',
    name: 'Menu Management System',
    description: 'Real-time menu updates by restaurant owners',
    status: 'partial',
    category: 'Restaurant Features',
    completionPercentage: 60,
    notes: 'Backend routes exist, frontend needs enhancement',
  },
  {
    id: 'restaurant-reservations',
    name: 'Reservation & Table Management',
    description: 'Table booking and reservation management system',
    status: 'partial',
    category: 'Restaurant Features',
    completionPercentage: 30,
    notes: 'Backend routes exist, frontend implementation needed',
  },
  {
    id: 'restaurant-qr-menus',
    name: 'QR Code Menus',
    description: 'QR code menus with instant review prompts',
    status: 'partial',
    category: 'Restaurant Features',
    completionPercentage: 40,
    notes: 'Backend routes exist, QR generation and scanning needed',
  },
  {
    id: 'restaurant-insights',
    name: 'Restaurant Insights Dashboard',
    description: 'Analytics on reviews and customer trends for owners',
    status: 'not-implemented',
    category: 'Restaurant Features',
    completionPercentage: 10,
  },
  
  // Food & Dish Features
  {
    id: 'dish-listings',
    name: 'Dish Listings',
    description: 'Dish listings with images, prices, and details',
    status: 'production',
    category: 'Food & Dish Features',
    completionPercentage: 100,
  },
  {
    id: 'dish-ratings',
    name: 'Star Ratings System',
    description: 'Star ratings for restaurants and individual dishes',
    status: 'production',
    category: 'Food & Dish Features',
    completionPercentage: 100,
  },

  {
    id: 'dietary-tags',
    name: 'Allergen & Dietary Tags',
    description: 'Vegan, halal, gluten-free, allergen information',
    status: 'partial',
    category: 'Food & Dish Features',
    completionPercentage: 60,
    notes: 'Basic implementation, needs expansion',
  },
  
  // Social & Community Features
  {
    id: 'user-profiles',
    name: 'User Profiles',
    description: 'User profiles with activity history and preferences',
    status: 'production',
    category: 'Social & Community',
    completionPercentage: 100,
  },
  {
    id: 'follow-system',
    name: 'Follow/Unfollow System',
    description: 'Users can follow and unfollow other users',
    status: 'production',
    category: 'Social & Community',
    completionPercentage: 100,
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    description: 'Posts, photos, reviews, and social interactions',
    status: 'production',
    category: 'Social & Community',
    completionPercentage: 100,
  },
  {
    id: 'post-interactions',
    name: 'Post Interactions',
    description: 'Likes, comments, and reactions on posts',
    status: 'production',
    category: 'Social & Community',
    completionPercentage: 100,
  },
  {
    id: 'messaging-system',
    name: 'Direct Messaging',
    description: 'Private messaging between users',
    status: 'production',
    category: 'Social & Community',
    completionPercentage: 100,
  },
  {
    id: 'gamification',
    name: 'Gamification System',
    description: 'Badges, levels, foodie leaderboards, achievements',
    status: 'partial',
    category: 'Social & Community',
    completionPercentage: 50,
    notes: 'Backend ready, frontend UI needs enhancement',
  },
  
  // Search & Discovery
  {
    id: 'restaurant-search',
    name: 'Restaurant & Dish Search',
    description: 'Comprehensive search with filters and suggestions',
    status: 'production',
    category: 'Search & Discovery',
    completionPercentage: 100,
  },
  {
    id: 'advanced-filters',
    name: 'Advanced Filters',
    description: 'Location, cuisine, price, rating, dietary filters',
    status: 'production',
    category: 'Search & Discovery',
    completionPercentage: 100,
  },
  {
    id: 'photo-search',
    name: 'Photo Recognition Search',
    description: 'Upload food photo to find nearby restaurants serving it',
    status: 'production',
    category: 'Search & Discovery',
    completionPercentage: 100,
  },
  {
    id: 'geolocation',
    name: 'Geolocation Services',
    description: 'Location-based restaurant discovery and directions',
    status: 'partial',
    category: 'Search & Discovery',
    completionPercentage: 40,
    notes: 'Basic implementation, needs real GPS integration',
  },
  

  
  // Delivery & Ordering (Removed third-party delivery integrations)
  {
    id: 'order-tracking',
    name: 'Order Tracking',
    description: 'In-app order status tracking (partner integrations removed)',
    status: 'not-implemented',
    category: 'Delivery & Ordering',
    completionPercentage: 0,
    notes: 'Third-party delivery integrations have been removed from the platform',
  },
  
  // Loyalty & Rewards
  {
    id: 'loyalty-points',
    name: 'EatRate Points System',
    description: 'Universal points for reviews, posts, dining, referrals',
    status: 'partial',
    category: 'Loyalty & Rewards',
    completionPercentage: 70,
    notes: 'Backend implemented, frontend has encoding issues',
  },
  {
    id: 'reward-redemption',
    name: 'Reward Redemption',
    description: 'Redeem points for discounts, free meals, partner rewards',
    status: 'partial',
    category: 'Loyalty & Rewards',
    completionPercentage: 60,
    notes: 'Backend ready, frontend implementation needed',
  },
  
  // Admin & Management
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    description: 'Comprehensive admin panel for platform management',
    status: 'production',
    category: 'Admin & Management',
    completionPercentage: 100,
  },
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Admin tools for user account management',
    status: 'production',
    category: 'Admin & Management',
    completionPercentage: 100,
  },
  {
    id: 'content-moderation',
    name: 'Content Moderation',
    description: 'Post and review moderation tools',
    status: 'production',
    category: 'Admin & Management',
    completionPercentage: 100,
  },
  {
    id: 'analytics-insights',
    name: 'Analytics & Insights',
    description: 'Platform analytics and business intelligence',
    status: 'production',
    category: 'Admin & Management',
    completionPercentage: 100,
  },
  
  // Technical Features
  {
    id: 'push-notifications',
    name: 'Push Notifications',
    description: 'In-app and push notification system',
    status: 'production',
    category: 'Technical Features',
    completionPercentage: 100,
  },
  {
    id: 'multi-language',
    name: 'Multi-language Support',
    description: 'English and French language support',
    status: 'production',
    category: 'Technical Features',
    completionPercentage: 100,
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Dark theme support for better user experience',
    status: 'production',
    category: 'Technical Features',
    completionPercentage: 100,
  },
  {
    id: 'performance-monitoring',
    name: 'Performance Monitoring',
    description: 'Error tracking and performance optimization',
    status: 'production',
    category: 'Technical Features',
    completionPercentage: 100,
  },
  
  // Supplier Features
  {
    id: 'supplier-directory',
    name: 'Supplier Directory',
    description: 'Directory of food suppliers and vendors',
    status: 'production',
    category: 'Supplier Features',
    completionPercentage: 100,
  },
  {
    id: 'supply-tracking',
    name: 'Fresh Food Supply Tracking',
    description: 'Track fresh food supply chain for restaurants',
    status: 'not-implemented',
    category: 'Supplier Features',
    completionPercentage: 10,
  },
];

const CATEGORIES = Array.from(new Set(FEATURES.map(f => f.category)));

export default function FeaturesScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'completion'>('name');

  const filteredFeatures = useMemo(() => {
    let filtered = FEATURES;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        feature =>
          feature.name.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query) ||
          feature.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(feature => feature.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(feature => feature.status === selectedStatus);
    }

    // Sort features
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { 'production': 0, 'partial': 1, 'not-implemented': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'completion':
          return b.completionPercentage - a.completionPercentage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  const getStatusIcon = (status: FeatureStatus) => {
    switch (status) {
      case 'production':
        return <CheckCircle size={20} color="#10B981" />;
      case 'partial':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'not-implemented':
        return <XCircle size={20} color="#EF4444" />;
    }
  };

  const getStatusText = (status: FeatureStatus) => {
    switch (status) {
      case 'production':
        return 'Production Ready';
      case 'partial':
        return 'Partially Implemented';
      case 'not-implemented':
        return 'Not Implemented';
    }
  };

  const getStatusColor = (status: FeatureStatus) => {
    switch (status) {
      case 'production':
        return '#10B981';
      case 'partial':
        return '#F59E0B';
      case 'not-implemented':
        return '#EF4444';
    }
  };

  const stats = useMemo(() => {
    const total = FEATURES.length;
    const production = FEATURES.filter(f => f.status === 'production').length;
    const partial = FEATURES.filter(f => f.status === 'partial').length;
    const notImplemented = FEATURES.filter(f => f.status === 'not-implemented').length;
    const avgCompletion = Math.round(
      FEATURES.reduce((sum, f) => sum + f.completionPercentage, 0) / total
    );

    return { total, production, partial, notImplemented, avgCompletion };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Feature Dashboard',
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: '#FFFFFF',
        }}
      />

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Features</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.production}</Text>
          <Text style={styles.statLabel}>Production Ready</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.partial}</Text>
          <Text style={styles.statLabel}>Partial</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.notImplemented}</Text>
          <Text style={styles.statLabel}>Not Implemented</Text>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Overall Platform Completion</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stats.avgCompletion}%` }]} />
        </View>
        <Text style={styles.progressText}>{stats.avgCompletion}% Complete</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search features..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'All' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'All' && styles.filterChipTextActive,
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['All', 'production', 'partial', 'not-implemented'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'All' ? 'All Status' : getStatusText(status as FeatureStatus)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'completion', label: 'Completion' }].map(sort => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.filterChip,
                sortBy === sort.key && styles.filterChipActive,
              ]}
              onPress={() => setSortBy(sort.key as 'name' | 'status' | 'completion')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortBy === sort.key && styles.filterChipTextActive,
                ]}
              >
                Sort by {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Features List */}
      <ScrollView style={styles.featuresList} showsVerticalScrollIndicator={false}>
        {filteredFeatures.map(feature => (
          <View key={feature.id} style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View style={styles.featureTitle}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(feature.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(feature.status) }]}>
                    {getStatusText(feature.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.categoryTag}>{feature.category}</Text>
            </View>

            <Text style={styles.featureDescription}>{feature.description}</Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressPercentage}>{feature.completionPercentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${feature.completionPercentage}%`,
                      backgroundColor: getStatusColor(feature.status),
                    },
                  ]}
                />
              </View>
            </View>

            {feature.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{feature.notes}</Text>
              </View>
            )}

            {feature.dependencies && feature.dependencies.length > 0 && (
              <View style={styles.dependenciesContainer}>
                <Text style={styles.dependenciesLabel}>Dependencies:</Text>
                <Text style={styles.dependenciesText}>{feature.dependencies.join(', ')}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {filteredFeatures.length === 0 && (
        <View style={styles.emptyState}>
          <Filter size={48} color="#6B7280" />
          <Text style={styles.emptyStateText}>No features match your filters</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your search or filter criteria</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  filterRow: {
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  featuresList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureHeader: {
    marginBottom: 12,
  },
  featureTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTag: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  dependenciesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  dependenciesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  dependenciesText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});