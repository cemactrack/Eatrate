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
import {
  Settings,
  Grid,
  Heart,
  Bookmark,
  MapPin,
  Shield,
  Calendar,
  Trophy,
  Star,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  Camera,
  Share2,
  MessageCircle,
  Bell,
  Gift,
  BarChart3,
  Crown,
  Flame,
  Edit3,
  Users,
  Zap,
} from 'lucide-react-native';
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
      testID={`tab-${label.toLowerCase()}`}
      style={[styles.tabChip, isActive ? styles.tabChipActive : undefined]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.tabIcon}>
        {/* eslint-disable-next-line @rork/linters/general-no-raw-text */}
        {icon}
      </View>
      <Text style={[styles.tabChipLabel, isActive ? styles.tabChipLabelActive : undefined]}>{label}</Text>
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

  const uri = post.content?.images?.[0] ??
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';

  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: imageSize, height: imageSize }]}
      onPress={onPress}
      testID={`post-${post.id}`}
      accessibilityRole="imagebutton"
    >
      <Image source={{ uri }} style={styles.gridImage} resizeMode="cover" />
      {post.content?.images && post.content.images.length > 1 && (
        <View style={styles.multipleIndicator}>
          <Grid size={16} color="white" />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStats}>
          <Heart size={14} color="white" fill="white" />
          <Text style={styles.gridStatText}>{post.likesCount ?? 0}</Text>
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
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const userPostsQuery = trpc.posts.getUserPosts.useQuery(
    {
      userId: user?.id,
      status: 'published',
      limit: 50,
    },
    {
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 5,
    }
  );

  const { data: userProfile } = trpc.users.getProfile.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  const { data: followStats } = trpc.users.followStats.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  const { data: userReputation } = trpc.reputation.getUserReputation.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  const userAchievements = useMemo(() => ({
    totalBadges: 8,
    recentBadges: [
      { name: 'Food Explorer', earnedAt: new Date().toISOString(), icon: '🍽️', rarity: 'common' },
      { name: 'Review Master', earnedAt: new Date(Date.now() - 86400000).toISOString(), icon: '⭐', rarity: 'rare' },
      { name: 'Photo Pro', earnedAt: new Date(Date.now() - 172800000).toISOString(), icon: '📸', rarity: 'epic' },
      { name: 'Social Butterfly', earnedAt: new Date(Date.now() - 259200000).toISOString(), icon: '🦋', rarity: 'common' },
    ],
    streaks: {
      currentLoginStreak: 7,
      longestLoginStreak: 23,
      currentReviewStreak: 3,
      longestReviewStreak: 12,
    },
    milestones: {
      totalReviews: 47,
      totalPhotos: 156,
      totalLikes: 892,
      totalFollowers: 234,
    },
  }), []);

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
    photosThisMonth: Math.floor(Math.random() * 25) + 10,
  }), []);

  const bookmarkedPostsQuery = trpc.posts.getBookmarked.useQuery(
    { limit: 50 },
    {
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 5,
    }
  );

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
      username: user.email?.split('@')[0] || 'user',
      displayName: user.displayName ?? (user.email?.split('@')[0] || 'User'),
      avatar:
        user.avatar ||
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces',
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
        recentAchievements: userAchievements?.recentBadges || [],
      },
      activityStats: mockActivityStats,
      isVerified: false,
      joinedDate: userProfile?.joinedAt || new Date().toISOString(),
    };
  }, [user, userPostsQuery.data?.total, followStats, userProfile, userReputation, userAchievements, mockActivityStats]);

  const userPosts = userPostsQuery.data?.posts || [];
  const likedPosts = useMemo(() => {
    return (feedQuery.data?.posts || []).filter((p) => p.isLiked);
  }, [feedQuery.data?.posts]);
  const savedPosts = bookmarkedPostsQuery.data?.posts || [];

  const getTabData = () => {
    switch (activeTab) {
      case 'liked':
        return likedPosts;
      case 'saved':
        return savedPosts;
      case 'reviews':
        return userPosts.filter((p) => !!p.content?.rating && p.content.rating > 0);
      case 'photos':
        return userPosts.filter((p) => !!p.content?.images && p.content.images.length > 0);
      default:
        return userPosts;
    }
  };

  const handlePostPress = useCallback(
    (postId: string) => {
      console.log('Post pressed:', postId);
      router.push(`/posts/${postId}`);
    },
    [router]
  );

  const handleEditProfile = useCallback(() => {
    console.log('Edit profile pressed');
    router.push('/profile/edit');
  }, [router]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // Removed unused handleLogout function

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Header with Gradient */}
        <View style={styles.modernHeader}>
          <View style={styles.gradientBackground}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=500&fit=crop' }}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
            <View style={styles.gradientOverlay} />
          </View>

          {/* Top Navigation */}
          <View style={styles.topNav}>
            <View style={styles.usernameContainer}>
              <Text style={styles.modernUsername}>@{currentUser.username}</Text>
              {currentUser.isVerified && (
                <CheckCircle size={18} color="#00D4FF" style={styles.verifiedIcon} />
              )}
            </View>
            <View style={styles.navActions}>
              {isAdmin && (
                <TouchableOpacity onPress={handleAdminPanel} style={styles.navButton} testID="admin-button">
                  <Shield size={20} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSettings} style={styles.navButton} testID="settings-button">
                <Settings size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: currentUser.avatar }} style={styles.modernAvatar} />
              <View style={styles.statusIndicator} />
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.nameSection}>
                <Text style={styles.modernDisplayName}>{currentUser.displayName}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.modernLevelBadge}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={styles.modernLevelText}>{userReputation?.level || 'Newcomer'}</Text>
                  </View>
                  <View style={styles.reputationBadge}>
                    <Zap size={12} color="#FF6B35" />
                    <Text style={styles.reputationText}>{userReputation?.points || 0}</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)} style={styles.bioContainer}>
                <Text style={styles.modernBio} numberOfLines={showFullBio ? undefined : 2}>
                  {currentUser.bio}
                </Text>
                {currentUser.bio.length > 100 && (
                  <Text style={styles.modernReadMore}>{showFullBio ? 'Show less' : 'Read more'}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.modernInfoRow}>
                {currentUser.location && (
                  <View style={styles.modernInfoPill}>
                    <MapPin size={12} color="#8E8E93" />
                    <Text style={styles.modernInfoText}>
                      {currentUser.location.city}, {currentUser.location.country}
                    </Text>
                  </View>
                )}
                <View style={styles.modernInfoPill}>
                  <Calendar size={12} color="#8E8E93" />
                  <Text style={styles.modernInfoText}>
                    {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Stats Cards */}
        <View style={styles.modernStatsContainer}>
          <View style={styles.modernStatCard}>
            <View style={styles.statIconContainer}>
              <Grid size={20} color="#007AFF" />
            </View>
            <Text style={styles.modernStatNumber}>{currentUser.postsCount}</Text>
            <Text style={styles.modernStatLabel}>Posts</Text>
          </View>
          
          <TouchableOpacity
            style={styles.modernStatCard}
            onPress={() => router.push(`/users/${user?.id}/followers`)}
          >
            <View style={styles.statIconContainer}>
              <Users size={20} color="#34C759" />
            </View>
            <Text style={styles.modernStatNumber}>{currentUser.followersCount.toLocaleString()}</Text>
            <Text style={styles.modernStatLabel}>Followers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modernStatCard}
            onPress={() => router.push(`/users/${user?.id}/following`)}
          >
            <View style={styles.statIconContainer}>
              <Heart size={20} color="#FF3B30" />
            </View>
            <Text style={styles.modernStatNumber}>{currentUser.followingCount.toLocaleString()}</Text>
            <Text style={styles.modernStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Modern Action Buttons */}
        <View style={styles.modernActionRow}>
          <TouchableOpacity
            testID="edit-profile-button"
            style={styles.modernPrimaryButton}
            onPress={handleEditProfile}
          >
            <Edit3 size={18} color="white" />
            <Text style={styles.modernPrimaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="share-profile-button"
            style={styles.modernSecondaryButton}
            onPress={() => console.log('Share profile')}
          >
            <Share2 size={18} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            testID="camera-button"
            style={styles.modernSecondaryButton}
            onPress={() => console.log('AI Scanner feature removed')}
          >
            <Camera size={18} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            testID="messages-button"
            style={styles.modernSecondaryButton}
            onPress={() => router.push('/messages')}
          >
            <MessageCircle size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

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

          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Eye size={20} color={Colors.light.tint} />
              <Flame size={12} color={Colors.light.warning} />
            </View>
            <Text style={styles.statsCardNumber}>{currentUser.activityStats.totalViews.toLocaleString()}</Text>
            <Text style={styles.statsCardLabel}>Profile Views</Text>
            <Text style={styles.statsCardChange}>{mockActivityStats.engagementRate}% engagement</Text>
          </View>

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

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => router.push('/profile/analytics')}>
            <BarChart3 size={16} color={Colors.light.tint} />
            <Text style={styles.secondaryActionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => router.push('/notifications')}>
            <Bell size={16} color={Colors.light.tint} />
            <Text style={styles.secondaryActionText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => router.push('/loyalty/rewards')}>
            <Gift size={16} color={Colors.light.tint} />
            <Text style={styles.secondaryActionText}>Rewards</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/bookmarks')} testID="bookmarks-button">
            <Bookmark size={20} color={Colors.light.tint} />
            <Text style={styles.quickAccessText}>Bookmarks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/achievements')} testID="achievements-button">
            <Trophy size={20} color={Colors.light.warning} />
            <Text style={styles.quickAccessText}>Achievements</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/events')} testID="events-button">
            <Calendar size={20} color={Colors.light.success} />
            <Text style={styles.quickAccessText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/reservations')} testID="reservations-button">
            <Star size={20} color={Colors.light.error} />
            <Text style={styles.quickAccessText}>Reservations</Text>
          </TouchableOpacity>
        </View>

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
                const rarityStyle =
                  achievement.rarity === 'common'
                    ? styles.rarityCommon
                    : achievement.rarity === 'rare'
                    ? styles.rarityRare
                    : achievement.rarity === 'epic'
                    ? styles.rarityEpic
                    : styles.rarityCommon;

                return (
                  <View key={`achievement-${index}`} style={[styles.achievementCard, rarityStyle]}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementRarity}>{achievement.rarity}</Text>
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

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

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              <TabButton
                icon={<Grid size={16} color={activeTab === 'posts' ? Colors.light.background : Colors.light.secondary} />}
                label="Posts"
                isActive={activeTab === 'posts'}
                onPress={() => handleTabChange('posts')}
              />
              <TabButton
                icon={<Star size={16} color={activeTab === 'reviews' ? Colors.light.background : Colors.light.secondary} />}
                label="Reviews"
                isActive={activeTab === 'reviews'}
                onPress={() => handleTabChange('reviews')}
              />
              <TabButton
                icon={<Camera size={16} color={activeTab === 'photos' ? Colors.light.background : Colors.light.secondary} />}
                label="Photos"
                isActive={activeTab === 'photos'}
                onPress={() => handleTabChange('photos')}
              />
              <TabButton
                icon={<Heart size={16} color={activeTab === 'liked' ? Colors.light.background : Colors.light.secondary} />}
                label="Liked"
                isActive={activeTab === 'liked'}
                onPress={() => handleTabChange('liked')}
              />
              <TabButton
                icon={<Bookmark size={16} color={activeTab === 'saved' ? Colors.light.background : Colors.light.secondary} />}
                label="Saved"
                isActive={activeTab === 'saved'}
                onPress={() => handleTabChange('saved')}
              />
            </View>
          </ScrollView>
        </View>

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
                {activeTab === 'posts'
                  ? 'No posts yet'
                  : activeTab === 'reviews'
                  ? 'No reviews yet'
                  : activeTab === 'photos'
                  ? 'No photos yet'
                  : activeTab === 'liked'
                  ? 'No liked posts'
                  : 'No saved posts'}
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
                <PostGridItem post={item} onPress={() => handlePostPress(item.id)} />
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
    backgroundColor: '#F8F9FA',
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
  
  // Modern Header Styles
  modernHeader: {
    position: 'relative',
    paddingBottom: 24,
  },
  gradientBackground: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  
  // Top Navigation
  topNav: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernUsername: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  navActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  
  // Profile Section
  profileSection: {
    position: 'absolute',
    bottom: -60,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  modernAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    borderWidth: 3,
    borderColor: 'white',
  },
  
  profileInfo: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  nameSection: {
    marginBottom: 12,
  },
  modernDisplayName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modernLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  modernLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8860B',
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  reputationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
  },
  
  bioContainer: {
    marginVertical: 12,
  },
  modernBio: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
  },
  modernReadMore: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  
  modernInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  modernInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modernInfoText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  
  // Modern Stats
  modernStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 80,
    marginBottom: 20,
    gap: 12,
  },
  modernStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modernStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  
  // Modern Actions
  modernActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  modernPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modernPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modernSecondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
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
  statsCardChange: {
    fontSize: 10,
    color: Colors.light.success,
    marginTop: 2,
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.accent,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 12,
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
  recentActivityContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
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
  achievementDate: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  rarityCommon: { borderColor: Colors.light.secondary },
  rarityRare: { borderColor: Colors.light.tint },
  rarityEpic: { borderColor: Colors.light.warning },
  preferencesContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  preferencesGrid: {
    gap: 12,
  },
  preferenceItem: {
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 10,
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
  insightsContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
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
  tabsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  tabChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  tabChipLabel: {
    fontSize: 13,
    color: Colors.light.secondary,
    fontWeight: '600',
  },
  tabChipLabelActive: {
    color: Colors.light.background,
  },
  postsGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    borderRadius: 6,
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
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
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
  createPostButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 32,
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
});
