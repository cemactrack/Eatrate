import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Grid, Heart, Bookmark, Award, Users, MapPin, LogOut, Shield } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Post } from '@/types/restaurant';
import { useAuth } from '@/providers/AuthProvider';
import { useAdmin } from '@/providers/AdminProvider';

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
      <View>{icon}</View>
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
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { logout } = authContext || { logout: async () => {} };
  const { isAdmin } = useAdmin();
  const router = useRouter();
  
  // Using the first user as the current user for display
  const currentUser = {
    id: 'me',
    username: 'eatrate_user',
    displayName: 'EatRate User',
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    badges: [],
  } as const;
  const userPosts: Post[] = [];
  const likedPosts: Post[] = [];
  const savedPosts: Post[] = [];

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
  }, []);

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
    setActiveTab(tab);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.followersCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.followingCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.displayName}>{currentUser.displayName}</Text>
            <Text style={styles.bio}>Welcome to EatRate</Text>
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
            <TouchableOpacity testID="share-profile-button" style={styles.shareButton}>
              <Users size={16} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity testID="share-profile-button" style={styles.shareButton}>
              <MapPin size={16} color={Colors.light.text} />
            </TouchableOpacity>
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
          {getTabData().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'posts' ? 'No posts yet' : 
                 activeTab === 'liked' ? 'No liked posts' : 'No saved posts'}
              </Text>
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
});