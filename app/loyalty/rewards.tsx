import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';
import { trpc } from '@/lib/trpc';
import { Star, Gift, Trophy, Zap, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_meal' | 'partner_reward';
  expiresAt?: Date;
  isActive: boolean;
  canAfford?: boolean;
  daysUntilExpiry?: number | null;
}

interface UserPoints {
  total: number;
  available: number;
  earned: number;
  redeemed: number;
}

const REWARD_CATEGORIES = [
  { id: 'all', label: 'All', icon: Gift },
  { id: 'food', label: 'Food', icon: Star },
  { id: 'discount', label: 'Discounts', icon: Zap },
  { id: 'experience', label: 'Experiences', icon: Trophy },
  { id: 'merchandise', label: 'Merchandise', icon: Gift },
] as const;

export default function LoyaltyRewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Queries
  const pointsQuery = trpc.loyalty.getUserPoints.useQuery();
  const rewardsQuery = trpc.loyalty.getAvailableRewards.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory as any,
  });

  // Mutations
  const redeemMutation = trpc.loyalty.redeemReward.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Reward redeemed successfully!');
      pointsQuery.refetch();
      rewardsQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to redeem reward');
    },
  });

  const handleRedeemReward = useCallback(async (reward: Reward) => {
    if (!pointsQuery.data || pointsQuery.data.totalPoints < reward.pointsCost) {
      Alert.alert('Insufficient Points', 'You do not have enough points to redeem this reward.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${reward.title}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => redeemMutation.mutate({ rewardId: reward.id }),
        },
      ]
    );
  }, [pointsQuery.data, redeemMutation]);

  const renderRewardCard = useCallback(({ item: reward }: { item: Reward }) => {
    const canRedeem = pointsQuery.data && pointsQuery.data.totalPoints >= reward.pointsCost && reward.isActive;
    const isExpiringSoon = reward.expiresAt && new Date(reward.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

    return (
      <View style={[styles.rewardCard, { backgroundColor: colors.card }]}>
        <View style={styles.rewardHeader}>
          <View style={[styles.rewardIcon, { backgroundColor: colors.tint + '20' }]}>
            <Gift size={20} color={colors.tint} />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.title}</Text>
            <Text style={[styles.rewardDescription, { color: colors.secondary }]}>
              {reward.description}
            </Text>
          </View>
        </View>

        <View style={styles.rewardFooter}>
          <View style={styles.pointsContainer}>
            <Star size={16} color={colors.tint} />
            <Text style={[styles.pointsText, { color: colors.tint }]}>
              {reward.pointsCost} points
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.redeemButton,
              {
                backgroundColor: canRedeem ? colors.tint : colors.secondary + '40',
              },
            ]}
            onPress={() => handleRedeemReward(reward)}
            disabled={!canRedeem || redeemMutation.isPending}
          >
            <Text
              style={[
                styles.redeemButtonText,
                { color: canRedeem ? colors.background : colors.secondary },
              ]}
            >
              {redeemMutation.isPending ? 'Redeeming...' : 'Redeem'}
            </Text>
          </TouchableOpacity>
        </View>

        {reward.expiresAt && (
          <View style={styles.expiryContainer}>
            <Clock size={12} color={isExpiringSoon ? '#ff6b6b' : colors.secondary} />
            <Text style={[styles.expiryText, { color: isExpiringSoon ? '#ff6b6b' : colors.secondary }]}>
              Expires {new Date(reward.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  }, [colors, pointsQuery.data, handleRedeemReward, redeemMutation.isPending]);

  if (pointsQuery.isLoading || rewardsQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Loyalty Rewards',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading rewards...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Loyalty Rewards',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Points Header */}
      <View style={[styles.pointsHeader, { backgroundColor: colors.tint }]}>
        <View style={styles.pointsContent}>
          <Star size={32} color={colors.background} />
          <View style={styles.pointsInfo}>
            <Text style={[styles.pointsValue, { color: colors.background }]}>
              {pointsQuery.data?.totalPoints || 0}
            </Text>
            <Text style={[styles.pointsLabel, { color: colors.background }]}>Available Points</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/loyalty/history' as any)}
        >
          <Text style={[styles.historyButtonText, { color: colors.background }]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {REWARD_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: isSelected ? colors.tint : 'transparent',
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Icon
                  size={16}
                  color={isSelected ? colors.background : colors.text}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: isSelected ? colors.background : colors.text },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Rewards List */}
      <FlatList
        data={(rewardsQuery.data?.rewards || []) as Reward[]}
        renderItem={renderRewardCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.rewardsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Gift size={48} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              No rewards available in this category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  pointsHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsInfo: {
    gap: 4,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  pointsLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  historyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  rewardsList: {
    padding: 20,
    gap: 16,
  },
  rewardCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    gap: 4,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  rewardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  expiryText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});