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
import { UserMinus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface FollowingUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isFollowing: boolean;
}

const FollowingItem = React.memo(function FollowingItem({ 
  user, 
  onUnfollow, 
  onUserPress 
}: { 
  user: FollowingUser; 
  onUnfollow: (userId: string) => void;
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
        style={styles.followingButton}
        onPress={() => onUnfollow(user.id)}
      >
        <UserMinus size={16} color={Colors.light.text} />
        <Text style={styles.followingButtonText}>Following</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: followingData,
    isLoading,
    refetch,
  } = trpc.users.following.useQuery(
    { userId: userId ?? '', limit: 100 },
    { enabled: !!userId }
  );

  const followMutation = trpc.users.follow.useMutation();

  const following = followingData?.following ?? [];

  const handleUnfollow = useCallback(async (targetUserId: string) => {
    try {
      await followMutation.mutateAsync({ targetUserId });
      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  }, [followMutation, refetch]);

  const handleUserPress = useCallback((targetUserId: string) => {
    router.push(`/users/${targetUserId}`);
  }, [router]);

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

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Not following anyone yet</Text>
        <Text style={styles.emptySubtitle}>
          When this user follows people, they&apos;ll appear here
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Following' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading following...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Following' }} />
      
      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FollowingItem
            user={item}
            onUnfollow={handleUnfollow}
            onUserPress={handleUserPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
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