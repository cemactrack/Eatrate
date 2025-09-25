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
import { Settings, Grid, Heart, Bookmark, Award, MapPin, LogOut, Shield, Calendar, Trophy, Star, TrendingUp, Eye, Clock, CheckCircle, Camera, Share2, MessageCircle, Bell, Gift, Target, BarChart3, Medal, Crown, Flame } from 'lucide-react-native';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved' | 'reviews' | 'photos'>('posts');
  const [showFullBio, setShowFullBio] = useState<boolean>(false);
  const [selectedStatsPeriod] = useState<'week' | 'month' | 'year'>('month');
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

  // Enhanced user achievements - memoized to prevent re-renders
  const userAchievements = useMemo(() => ({
    totalBadges: 8,
    recentBadges: [
      { name: 'Food Explorer', earnedAt: new Date().toISOString(), icon: '🍽️', rarity: 'common' },
      { name: 'Review Master', earnedAt: new Date(Date.now() - 86400000).toISOString(), icon: '⭐', rarity: 'rare' },
      { name: 'Photo Pro', earnedAt: new Date(Date.now() - 172800000).toISOString(), icon: '📸', rarity: 'epic' },
      { name: 'Social Butterfly', earnedAt: new Date(Date.now() - 259200000).toISOString(), icon: '🦋', rarity: 'common' }
    ],
    streaks: {
      currentLoginStreak: 7,
      longestLoginStreak: 23,
      currentReviewStreak: 3,
      longestReviewStreak: 12
    },
    milestones: {
      totalReviews: 47,
      totalPhotos: 156,
      totalLikes: 892,
      totalFollowers: 234
    }
  }), []);

  // Enhanced activity stats - memoized to prevent re-renders
  const mockActivityStats = useMemo(() => ({
    totalViews: Math.floor(Math.random() * 10000) + 5000,
    totalLikes: Math.floor(Math.random() * 1000) + 500,
    avgRating: 4.2 + Math.random() * 0.8,
    engagementRate: Math.floor(Math.random() * 30) + 15,
    monthlyGrowth: Math.floor(Math.random() * 20) + 5,
    topCuisines: ['Italian', 'Asian', 'Local'],
    favoriteTimeToEat: 'Evening',
    averageSpending: '$25-50',
    reviewsThisMonth: Math.floor(Math.random() * 15) + 5,
    photosThisMonth: Math.floor(Math.random() * 25) + 10
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
      case 'reviews':
        // Filter posts that are reviews
        return userPosts.filter(post => post.content.rating && post.content.rating > 0);
      case 'photos':
        // Filter posts that have images
        return userPosts.filter(post => post.content.images && post.content.images.length > 0);
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

  const handleTabChange = useCallback((tab: 'posts' | 'liked' | 'saved' | 'reviews' | 'photos') => {
    if (!tab?.trim() || tab.length > 20) return;
    const sanitizedTab = tab.trim() as 'posts' | 'liked' | 'saved' | 'reviews' | 'photos';
    if (!['posts', 'liked', 'saved', 'reviews', 'photos'].includes(sanitizedTab)) return;
    setActiveTab(sanitizedTab);
  }, []);
  

  
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
        {/* Enhanced Header with Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=300&fit=crop' }}
            style={styles.coverPhoto}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />
        </View>
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

        {/* Enhanced Profile Stats Cards */}
        <View style={styles.statsCardsContainer}>
          <TouchableOpacity style={styles.statsCard} onPress={() => router.push('/profile/analytics')}>
            <View style={styles.statsCardHeader}>
              <TrendingUp size={20} color={Colors.light.success} />
              <Text style={styles.statsCardPeriod}>{selectedStatsPeriod}</Text>
            </View>
            <Text style={styles.statsCardNumber}>{userReputation?.points || 0}</Text>
            <Text style={styles.statsCardLabel}>Reputation</Text>
            <Text style={styles.statsCardChange}>+{mockActivityStats.monthlyGrowth}% this month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Eye size={20} color={Colors.light.tint} />
              <Flame size={12} color={Colors.light.warning} />
            </View>
            <Text style={styles.statsCardNumber}>{currentUser.activityStats.totalViews.toLocaleString()}</Text>
            <Text style={styles.statsCardLabel}>Profile Views</Text>
            <Text style={styles.statsCardChange}>{mockActivityStats.engagementRate}% engagement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statsCard} onPress={() => router.push('/achievements')}>
            <View style={styles.statsCardHeader}>
              <Trophy size={20} color={Colors.light.warning} />
              <Crown size={12} color={Colors.light.success} />
            </View>
            <Text style={styles.statsCardNumber}>{currentUser.achievements.totalAchievements}</Text>
            <Text style={styles.statsCardLabel}>Achievements</Text>
            <Text style={styles.statsCardChange}>{userAchievements.streaks.currentLoginStreak} day streak</Text>
          </TouchableOpacity>
        </View>
        
        {/* Activity Streaks */}
        <View style={styles.streaksContainer}>
          <View style={styles.streakItem}>
            <Flame size={16} color={Colors.light.warning} />
            <Text style={styles.streakNumber}>{userAchievements.streaks.currentLoginStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Star size={16} color={Colors.light.tint} />
            <Text style={styles.streakNumber}>{userAchievements.streaks.currentReviewStreak}</Text>
            <Text style={styles.streakLabel}>Review Streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Target size={16} color={Colors.light.success} />
            <Text style={styles.streakNumber}>{mockActivityStats.reviewsThisMonth}</Text>
            <Text style={styles.streakLabel}>This Month</Text>
          </View>
          <View style={styles.streakItem}>
            <Camera size={16} color={Colors.light.error} />
            <Text style={styles.streakNumber}>{mockActivityStats.photosThisMonth}</Text>
            <Text style={styles.streakLabel}>Photos</Text>
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
              <View style={styles.levelBadge}>
                <Medal size={12} color={Colors.light.warning} />
                <Text style={styles.levelText}>{userReputation?.level || 'Newcomer'}</Text>
              </View>
            </View>
            
            {/* Enhanced Bio with Read More */}
            <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)}>
              <Text style={styles.bio} numberOfLines={showFullBio ? undefined : 3}>
                {currentUser.bio}
              </Text>
              {currentUser.bio.length > 100 && (
                <Text style={styles.readMoreText}>
                  {showFullBio ? 'Show less' : 'Read more'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Enhanced Location and Info */}
            <View style={styles.profileInfoGrid}>
              {currentUser.location && (
                <View style={styles.infoItem}>
                  <MapPin size={14} color={Colors.light.secondary} />
                  <Text style={styles.infoText}>
                    {currentUser.location.city}, {currentUser.location.country}
                  </Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Clock size={14} color={Colors.light.secondary} />
                <Text style={styles.infoText}>
                  Joined {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Star size={14} color={Colors.light.warning} />
                <Text style={styles.infoText}>
                  {currentUser.activityStats.avgRating.toFixed(1)} avg rating
                </Text>
              </View>
              <View style={styles.infoItem}>
                <TrendingUp size={14} color={Colors.light.success} />
                <Text style={styles.infoText}>
                  {userReputation?.trustScore || 0}% trust score
                </Text>
              </View>
            </View>
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

          {/* Enhanced Action Buttons */}
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
              style={styles.actionButton}
              onPress={() => console.log('Share profile')}
            >
              <Share2 size={16} color={Colors.light.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              testID="camera-button" 
              style={styles.actionButton}
              onPress={() => router.push('/ai/scanner')}
            >
              <Camera size={16} color={Colors.light.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              testID="messages-button" 
              style={styles.actionButton}
              onPress={() => router.push('/messages')}
            >
              <MessageCircle size={16} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          {/* Secondary Action Row */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => router.push('/profile/analytics')}
            >
              <BarChart3 size={16} color={Colors.light.tint} />
              <Text style={styles.secondaryActionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={16} color={Colors.light.tint} />
              <Text style={styles.secondaryActionText}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => router.push('/loyalty/rewards')}
            >
              <Gift size={16} color={Colors.light.tint} />
              <Text style={styles.secondaryActionText}>Rewards</Text>
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

          {/* Enhanced Recent Activity */}
          {userAchievements.recentBadges.length > 0 && (
            <View style={styles.recentActivityContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Achievements</Text>
                <TouchableOpacity onPress={() => router.push('/achievements')}>
                  <Text style={styles.sectionAction}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
                {userAchievements.recentBadges.slice(0, 5).map((achievement: any, index: number) => {
                  const rarityStyle = achievement.rarity === 'common' ? styles.rarityCommon :
                                    achievement.rarity === 'rare' ? styles.rarityRare :
                                    achievement.rarity === 'epic' ? styles.rarityEpic : styles.rarityCommon;
                  
                  return (
                    <View key={`achievement-${index}`} style={[styles.achievementCard, rarityStyle]}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <Text style={styles.achievementName}>{achievement.name}</Text>
                      <Text style={styles.achievementRarity}>{achievement.rarity}</Text>
                      <Text style={styles.achievementDate}>{new Date(achievement.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
          
          {/* Food Preferences Summary */}
          <View style={styles.preferencesContainer}>
            <Text style={styles.sectionTitle}>Food Profile</Text>
            <View style={styles.preferencesGrid}>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Top Cuisines</Text>
                <Text style={styles.preferenceValue}>{mockActivityStats.topCuisines.join(', ')}</Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Favorite Time</Text>
                <Text style={styles.preferenceValue}>{mockActivityStats.favoriteTimeToEat}</Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Avg Spending</Text>
                <Text style={styles.preferenceValue}>{mockActivityStats.averageSpending}</Text>
              </View>
            </View>
          </View>

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

        {/* Enhanced Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              <TabButton
                icon={<Grid size={18} color={activeTab === 'posts' ? Colors.light.tint : Colors.light.secondary} />}
                label="Posts"
                isActive={activeTab === 'posts'}
                onPress={() => handleTabChange('posts')}
              />
              <TabButton
                icon={<Star size={18} color={activeTab === 'reviews' ? Colors.light.tint : Colors.light.secondary} />}
                label="Reviews"
                isActive={activeTab === 'reviews'}
                onPress={() => handleTabChange('reviews')}
              />
              <TabButton
                icon={<Camera size={18} color={activeTab === 'photos' ? Colors.light.tint : Colors.light.secondary} />}
                label="Photos"
                isActive={activeTab === 'photos'}
                onPress={() => handleTabChange('photos')}
              />
              <TabButton
                icon={<Heart size={18} color={activeTab === 'liked' ? Colors.light.tint : Colors.light.secondary} />}
                label="Liked"
                isActive={activeTab === 'liked'}
                onPress={() => handleTabChange('liked')}
              />
              <TabButton
                icon={<Bookmark size={18} color={activeTab === 'saved' ? Colors.light.tint : Colors.light.secondary} />}
                label="Saved"
                isActive={activeTab === 'saved'}
                onPress={() => handleTabChange('saved')}
              />
            </View>
          </ScrollView>
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
                 activeTab === 'reviews' ? 'No reviews yet' :
                 activeTab === 'photos' ? 'No photos yet' :
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
  // New styles for enhanced profile
  coverPhotoContainer: {
    height: 120,
    position: 'relative',
    marginBottom: -40,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  statsCardPeriod: {
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statsCardChange: {
    fontSize: 10,
    color: Colors.light.success,
    marginTop: 2,
    textAlign: 'center',
  },
  streaksContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 10,
    color: Colors.light.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.warning,
    marginLeft: 4,
  },
  readMoreText: {
    fontSize: 12,
    color: Colors.light.tint,
    marginTop: 4,
    fontWeight: '500',
  },
  profileInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginLeft: 6,
    flex: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  achievementsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  achievementCard: {
    width: 120,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementRarity: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rarityCommon: {
    borderColor: Colors.light.secondary,
  },
  rarityRare: {
    borderColor: Colors.light.tint,
  },
  rarityEpic: {
    borderColor: Colors.light.warning,
  },
  preferencesContainer: {
    marginBottom: 24,
  },
  preferencesGrid: {
    gap: 12,
  },
  preferenceItem: {
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  preferenceLabel: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
});