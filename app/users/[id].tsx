import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserPlus, UserCheck, MapPin, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function OtherUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = String(params.id ?? '');

  const usersQuery = trpc.users.list.useQuery(
    undefined,
    {
      enabled: userId.length > 0,
      staleTime: 1000 * 60,
    }
  );

  const user = useMemo(() => {
    const list = (usersQuery.data as any)?.users ?? usersQuery.data ?? [];
    return (list as Array<any>).find((u) => u?.id === userId);
  }, [usersQuery.data, userId]);

  const { data: followStats } = trpc.users.followStats.useQuery(
    { userId },
    { enabled: userId.length > 0 }
  );
  const { data: profile } = trpc.users.getProfile.useQuery(
    { userId },
    { enabled: userId.length > 0 }
  );

  const [following, setFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);

  useEffect(() => {
    if (followStats) {
      setFollowing(followStats.isFollowing ?? false);
      setFollowersCount(followStats.followersCount ?? 0);
    }
  }, [followStats]);

  const followMutation = trpc.users.follow.useMutation({
    onSuccess: (res) => {
      setFollowing(res.following ?? false);
      setFollowersCount(res.followersCount ?? followersCount);
    },
    onError: (err) => {
      console.log('[Follow] error', err);
    },
  });

  const onToggleFollow = useCallback(() => {
    if (!userId || followMutation.isPending) return;
    setFollowing((prev) => !prev);
    setFollowersCount((c) => (following ? Math.max(0, c - 1) : c + 1));
    followMutation.mutate({ targetUserId: userId });
  }, [followMutation, userId, following]);

  if (usersQuery.isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}> 
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="go-back-button">
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: user.displayName,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.headerSection}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followingCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="follow-toggle-button"
            accessibilityRole="button"
            style={[styles.followBtn, following ? styles.following : styles.notFollowing]}
            onPress={onToggleFollow}
            disabled={followMutation.isPending}
          >
            {following ? (
              <UserCheck size={16} color={'white'} />
            ) : (
              <UserPlus size={16} color={'white'} />
            )}
            <Text style={styles.followBtnText}>{following ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
        </View>

        {(profile?.bio || profile?.location || (profile?.badges?.length ?? 0) > 0) && (
          <View style={styles.infoSection}>
            {profile?.bio ? (
              <View style={styles.bioBlock}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : null}

            {profile?.location ? (
              <View style={styles.locationRow}>
                <MapPin size={14} color={Colors.light.secondary} />
                <Text style={styles.locationText}>{profile.location.city}, {profile.location.country}</Text>
              </View>
            ) : null}

            {(profile?.badges?.length ?? 0) > 0 ? (
              <View style={styles.badgesRow}>
                {profile!.badges.map((b) => (
                  <View key={`${user.id}-${b}`} style={styles.badge}>
                    <Award size={12} color={Colors.light.warning} />
                    <Text style={styles.badgeText}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background },
  errorText: { color: Colors.light.text, fontSize: 16, marginBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backBtnText: { marginLeft: 6, color: Colors.light.text, fontSize: 14, fontWeight: '600' },
  headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  nameBlock: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  username: { marginTop: 4, color: Colors.light.secondary, fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  statLabel: { fontSize: 12, color: Colors.light.secondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8, flex: 1 },
  following: { backgroundColor: Colors.light.success },
  notFollowing: { backgroundColor: Colors.light.tint },
  followBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  infoSection: { paddingHorizontal: 16, marginTop: 16 },
  bioBlock: { marginBottom: 8 },
  bioText: { color: Colors.light.text, fontSize: 14, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  locationText: { color: Colors.light.secondary, fontSize: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: Colors.light.warning, marginLeft: 4, fontWeight: '500' },
});