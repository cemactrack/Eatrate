import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Grid, Heart, Bookmark, Award, MapPin, LogOut, Shield, Calendar, Trophy, Star, TrendingUp, Eye, Clock, CheckCircle, Camera, Share2 } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Post } from '@/types/restaurant';
import { useAuth } from '@/providers/AuthProvider';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton = React.memo(function TabButton({ icon, label, isActive, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
    >
      <View style={styles.tabIcon}>
        {/* eslint-disable-next-line @rork/linters/general-no-raw-text */}
        {icon}
      </View>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

interface PostGridItemProps {
  post: Post;
  onPress: () => void;
}

const PostGridItem = React.memo(function PostGridItem({ post, onPress }: PostGridItemProps) {
  const { width } = useWindowDimensions();
  const imageSize = (width - 48) / 3;
  
  return (
    <TouchableOpacity style={[styles.gridItem, { width: imageSize, height: imageSize }]} onPress={onPress}>
      <Image
        source={{ uri: post.content.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop' }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      {post.content.images && post.content.images.length > 1 && (
        <View style={styles.multipleIndicator}>
          <Grid size={16} color="white" />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStats}>
          <Heart size={14} color="white" fill="white" />
          <Text style={styles.gridStatText}>{post.likesCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved'>('posts');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  
  // Fetch user posts
  const userPostsQuery = trpc.posts.getUserPosts.useQuery(
    { 
      userId: user?.id,
      status: 'published',
      limit: 50 
    },
    { 
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Fetch user profile data
  const { data: userProfile } = trpc.users.getProfile.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  // Fetch follow stats
  // Fetch follow stats
  const { data: followStats } = trpc.users.followStats.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  // Fetch user reputation and achievements
  const { data: userReputation } = trpc.reputation.getUserReputation.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  // Mock user achievements - memoized to prevent re-renders
  const userAchievements = useMemo(() => ({
    totalBadges: 3,
    recentBadges: [
      { name: 'Food Explorer', earnedAt: new Date().toISOString() },
      { name: 'Review Master', earnedAt: new Date(Date.now() - 86400000).toISOString() }
    ]
  }), []);

  // Mock activity stats - memoized to prevent re-renders
  const mockActivityStats = useMemo(() => ({
    totalViews: Math.floor(Math.random() * 10000),
    totalLikes: Math.floor(Math.random() * 1000),
    avgRating: 4.2 + Math.random() * 0.8
  }), []);
  
  // Fetch bookmarked posts
  const bookmarkedPostsQuery = trpc.posts.getBookmarked.useQuery(
    { limit: 50 },
    { 
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 5,
    }
  );
  
  // Get posts from feed for liked posts (mock implementation)
  const feedQuery = trpc.posts.feed.useQuery(
    { type: 'recent', limit: 50 },
    { 
      enabled: activeTab === 'liked',
      staleTime: 1000 * 60 * 5,
    }
  );
  
  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.email?.split('@')[0] || user.phone || 'user',
      displayName: user.displayName,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces',
      followersCount: followStats?.followersCount || 0,
      followingCount: followStats?.followingCount || 0,
      postsCount: userPostsQuery.data?.total || 0,
      badges: userProfile?.badges || [],
      bio: userProfile?.bio || 'Food enthusiast exploring great flavors',
      location: userProfile?.location,
      preferences: userProfile?.preferences,
      reputation: userReputation || { score: 0, level: 'Newcomer', trustScore: 0 },
      achievements: {
        totalAchievements: userAchievements?.totalBadges || 0,
        recentAchievements: userAchievements?.recentBadges || []
      },
      activityStats: mockActivityStats,
      isVerified: false, // Mock verification status
      joinedDate: userProfile?.joinedAt || new Date().toISOString(),
    };
  }, [user, userPostsQuery.data?.total, followStats, userProfile, userReputation, userAchievements, mockActivityStats]);
  
  const userPosts = userPostsQuery.data?.posts || [];
  const likedPosts = useMemo(() => {
    // Filter posts that are liked by current user
    return (feedQuery.data?.posts || []).filter(post => post.isLiked);
  }, [feedQuery.data?.posts]);
  const savedPosts = bookmarkedPostsQuery.data?.posts || [];

  const getTabData = () => {
    switch (activeTab) {
      case 'liked':
        return likedPosts;
      case 'saved':
        return savedPosts;
      default:
        return userPosts;
    }
  };

  const handlePostPress = useCallback((postId: string) => {
    console.log('Post pressed:', postId);
    router.push(`/posts/${postId}`);
  }, [router]);

  const handleEditProfile = useCallback(() => {
    console.log('Edit profile pressed');
    router.push('/profile/edit');
  }, [router]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, router]);

  const handleAdminPanel = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleTabChange = useCallback((tab: 'posts' | 'liked' | 'saved') => {
    if (!tab?.trim() || tab.length > 20) return;
    const sanitizedTab = tab.trim() as 'posts' | 'liked' | 'saved';
    if (!['posts', 'liked', 'saved'].includes(sanitizedTab)) return;
    setActiveTab(sanitizedTab);
  }, []);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        userPostsQuery.refetch(),
        bookmarkedPostsQuery.refetch(),
        activeTab === 'liked' ? feedQuery.refetch() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userPostsQuery, bookmarkedPostsQuery, feedQuery, activeTab]);
  
  if (!user || !currentUser) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Pull to Refresh */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.light.tint} />
          ) : (
            <Text style={styles.refreshButtonText}>Pull to refresh</Text>
          )}
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity onPress={handleAdminPanel} style={styles.headerButton}>
                <Shield size={24} color={Colors.light.tint} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
              <Settings size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
              <LogOut size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Stats Cards */}
        <View style={styles.statsCardsContainer}>
          <View style={styles.statsCard}>
            <TrendingUp size={20} color={Colors.light.success} />
            <Text style={styles.statsCardNumber}>{userReputation?.points || 0}</Text>
            <Text style={styles.statsCardLabel}>Reputation</Text>
          </View>
          <View style={styles.statsCard}>
            <Eye size={20} color={Colors.light.tint} />
            <Text style={styles.statsCardNumber}>{currentUser.activityStats.totalViews.toLocaleString()}</Text>
            <Text style={styles.statsCardLabel}>Profile Views</Text>
          </View>
          <View style={styles.statsCard}>
            <Trophy size={20} color={Colors.light.warning} />
            <Text style={styles.statsCardNumber}>{currentUser.achievements.totalAchievements}</Text>
            <Text style={styles.statsCardLabel}>Achievements</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => router.push(`/users/${user?.id}/followers`)}
              >
                <Text style={styles.statNumber}>{currentUser.followersCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => router.push(`/users/${user?.id}/following`)}
              >
                <Text style={styles.statNumber}>{currentUser.followingCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{currentUser.displayName}</Text>
              {currentUser.isVerified && (
                <CheckCircle size={16} color={Colors.light.tint} style={styles.verifiedBadge} />
              )}
            </View>
            <Text style={styles.reputationLevel}>{userReputation?.level || 'Newcomer'}</Text>
            <Text style={styles.bio}>{currentUser.bio}</Text>
            {currentUser.location && (
              <View style={styles.locationContainer}>
                <MapPin size={14} color={Colors.light.secondary} />
                <Text style={styles.locationText}>
                  {currentUser.location.city}, {currentUser.location.country}
                </Text>
              </View>
            )}
            {user.email && (
              <Text style={styles.contactInfo}>{user.email}</Text>
            )}
            {user.phone && (
              <Text style={styles.contactInfo}>{user.phone}</Text>
            )}
          </View>

          {/* Badges */}
          {currentUser.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {currentUser.badges.map((badge) => (
                <View key={`${currentUser.id}-${badge}`} style={styles.badge}>
                  <Award size={12} color={Colors.light.warning} />
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              testID="edit-profile-button"
              accessibilityRole="button"
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              testID="share-profile-button" 
              style={styles.shareButton}
              onPress={() => console.log('Share profile')}
            >
              <Share2 size={16} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              testID="camera-button" 
              style={styles.shareButton}
              onPress={() => router.push('/ai/scanner')}
            >
              <Camera size={16} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              testID="analytics-button" 
              style={styles.shareButton}
              onPress={() => router.push('/profile/analytics')}
            >
              <TrendingUp size={16} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          {/* Quick Access Features */}
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/bookmarks')}
              testID="bookmarks-button"
            >
              <Bookmark size={20} color={Colors.light.tint} />
              <Text style={styles.quickAccessText}>Bookmarks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/achievements')}
              testID="achievements-button"
            >
              <Trophy size={20} color={Colors.light.warning} />
              <Text style={styles.quickAccessText}>Achievements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/events')}
              testID="events-button"
            >
              <Calendar size={20} color={Colors.light.success} />
              <Text style={styles.quickAccessText}>Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/reservations')}
              testID="reservations-button"
            >
              <Star size={20} color={Colors.light.error} />
              <Text style={styles.quickAccessText}>Reservations</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          {currentUser.achievements.recentAchievements.length > 0 && (
            <View style={styles.recentActivityContainer}>
              <Text style={styles.sectionTitle}>Recent Achievements</Text>
              <View style={styles.achievementsList}>
                {currentUser.achievements.recentAchievements.slice(0, 3).map((achievement: any, index: number) => (
                  <View key={`achievement-${index}`} style={styles.achievementItem}>
                    <Award size={16} color={Colors.light.warning} />
                    <Text style={styles.achievementText}>{achievement.name}</Text>
                    <Text style={styles.achievementDate}>{new Date(achievement.earnedAt).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Profile Insights */}
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>Profile Insights</Text>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Clock size={16} color={Colors.light.secondary} />
                <Text style={styles.insightText}>Joined {new Date(currentUser.joinedDate).toLocaleDateString()}</Text>
              </View>
              <View style={styles.insightItem}>
                <TrendingUp size={16} color={Colors.light.success} />
                <Text style={styles.insightText}>Trust Score: {userReputation?.trustScore || 0}%</Text>
              </View>
              <View style={styles.insightItem}>
                <Heart size={16} color={Colors.light.error} />
                <Text style={styles.insightText}>Avg Rating: {currentUser.activityStats.avgRating.toFixed(1)}/5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton
            icon={<Grid size={20} color={activeTab === 'posts' ? Colors.light.tint : Colors.light.secondary} />}
            label="Posts"
            isActive={activeTab === 'posts'}
            onPress={() => handleTabChange('posts')}
          />
          <TabButton
            icon={<Heart size={20} color={activeTab === 'liked' ? Colors.light.tint : Colors.light.secondary} />}
            label="Liked"
            isActive={activeTab === 'liked'}
            onPress={() => handleTabChange('liked')}
          />
          <TabButton
            icon={<Bookmark size={20} color={activeTab === 'saved' ? Colors.light.tint : Colors.light.secondary} />}
            label="Saved"
            isActive={activeTab === 'saved'}
            onPress={() => handleTabChange('saved')}
          />
        </View>

        {/* Posts Grid */}
        <View style={styles.postsGrid}>
          {(activeTab === 'posts' && userPostsQuery.isLoading) ||
           (activeTab === 'saved' && bookmarkedPostsQuery.isLoading) ||
           (activeTab === 'liked' && feedQuery.isLoading) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.loadingText}>Loading {activeTab}...</Text>
            </View>
          ) : getTabData().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'posts' ? 'No posts yet' : 
                 activeTab === 'liked' ? 'No liked posts' : 'No saved posts'}
              </Text>
              {activeTab === 'posts' && (
                <TouchableOpacity 
                  style={styles.createPostButton}
                  onPress={() => router.push('/(tabs)/(home)/create-post')}
                >
                  <Text style={styles.createPostButtonText}>Create your first post</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={getTabData()}
              numColumns={3}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PostGridItem
                  post={item}
                  onPress={() => handlePostPress(item.id)}
                />
              )}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
            />
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileSection: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  profileDetails: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.light.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: Colors.light.tint,
  },
  postsGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridContent: {
    gap: 2,
  },
  gridItem: {
    position: 'relative',
    marginBottom: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 8,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  bottomSpacing: {
    height: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 8,
  },
  contactInfo: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  createPostButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  quickAccessItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 6,
    textAlign: 'center',
  },
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statsCardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statsCardLabel: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  reputationLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  recentActivityContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  achievementsList: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
});