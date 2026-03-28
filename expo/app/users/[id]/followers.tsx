import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, UserMinus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface FollowerUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isFollowing: boolean;
}

const FollowerItem = React.memo(function FollowerItem({ 
  user, 
  onFollow, 
  onUserPress 
}: { 
  user: FollowerUser; 
  onFollow: (userId: string) => void;
  onUserPress: (userId: string) => void;
}) {
  return (
    <TouchableOpacity style={styles.userItem} onPress={() => onUserPress(user.id)}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, user.isFollowing && styles.followingButton]}
        onPress={() => onFollow(user.id)}
      >
        {user.isFollowing ? (
          <>
            <UserMinus size={16} color={Colors.light.text} />
            <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
          </>
        ) : (
          <>
            <UserPlus size={16} color="white" />
            <Text style={styles.followButtonText}>Follow</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function FollowersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: followersData,
    isLoading,
    refetch,
  } = trpc.users.followers.useQuery(
    { userId: userId ?? '', limit: 100 },
    { enabled: !!userId }
  );

  const followMutation = trpc.users.follow.useMutation();

  const followers = followersData?.followers ?? [];

  const handleFollow = useCallback(async (targetUserId: string) => {
    try {
      await followMutation.mutateAsync({ targetUserId });
      // Refetch to update follow status
      refetch();
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  }, [followMutation, refetch]);

  const handleUserPress = useCallback((targetUserId: string) => {
    router.push(`/users/${targetUserId}`);
  }, [router]);

  const handleLoadMore = useCallback(() => {
    // Pagination handled by limit increase if needed
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderFooter = () => {
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No followers yet</Text>
        <Text style={styles.emptySubtitle}>
          When people follow this user, they&apos;ll appear here
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Followers' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Followers' }} />
      
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FollowerItem
            user={item}
            onFollow={handleFollow}
            onUserPress={handleUserPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.secondary,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
  },
  followingButton: {
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  followingButtonText: {
    color: Colors.light.text,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});