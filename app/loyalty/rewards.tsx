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
  type: 'discount' | 'free_meal' | 'partner_reward';
  pointsCost: number;
  isActive: boolean;
  expiresAt?: Date | string;
  canAfford?: boolean;
  daysUntilExpiry?: number | null;
}

export default function LoyaltyRewardsScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'discount' | 'free_meal' | 'partner_reward'>('all');

  const userPointsQuery = trpc.loyalty.getUserPoints.useQuery();
  const rewardsQuery = trpc.loyalty.getAvailableRewards.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory
  });

  const redeemMutation = trpc.loyalty.redeemReward.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        'Reward Redeemed!',
        `Congratulations! Your redemption code is: ${data.redemptionCode}\n\n${data.instructions}`,
        [{ text: 'OK' }]
      );
      userPointsQuery.refetch();
      rewardsQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Redemption Failed', error.message);
    }
  });

  const handleRedeemReward = useCallback((reward: Reward) => {
    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.title}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: () => redeemMutation.mutate({ rewardId: reward.id })
        }
      ]
    );
  }, [redeemMutation]);

  const renderReward = useCallback(({ item: reward }: { item: Reward }) => {
    const canAfford = (userPointsQuery.data?.totalPoints || 0) >= reward.pointsCost;
    const isAvailable = reward.isActive;

    return (
      <View style={[styles.rewardCard, { backgroundColor: colors.card }]}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardIcon}>
            {reward.type === 'discount' && <Star size={24} color={colors.tint} />}
            {reward.type === 'free_meal' && <Gift size={24} color={colors.tint} />}
            {reward.type === 'partner_reward' && <Trophy size={24} color={colors.tint} />}
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.title}</Text>
            <Text style={[styles.rewardDescription, { color: colors.secondary }]}>{reward.description}</Text>
          </View>
        </View>
        
        <View style={styles.rewardFooter}>
          <View style={styles.pointsContainer}>
            <Zap size={16} color={colors.tint} />
            <Text style={[styles.pointsText, { color: colors.tint }]}>{reward.pointsCost} points</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.redeemButton,
              {
                backgroundColor: canAfford && isAvailable ? colors.tint : colors.border,
                opacity: canAfford && isAvailable ? 1 : 0.5
              }
            ]}
            onPress={() => handleRedeemReward(reward)}
            disabled={!canAfford || !isAvailable || redeemMutation.isPending}
          >
            <Text style={[styles.redeemButtonText, { color: colors.background }]}>
              {!isAvailable ? 'Unavailable' : !canAfford ? 'Not enough points' : 'Redeem'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {reward.expiresAt && (
          <View style={styles.expiryContainer}>
            <Clock size={12} color={colors.secondary} />
            <Text style={[styles.expiryText, { color: colors.secondary }]}>
              Expires: {new Date(reward.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  }, [colors, userPointsQuery.data, handleRedeemReward, redeemMutation.isPending]);

  const categories = [
    { key: 'all' as const, label: 'All Rewards', icon: Gift },
    { key: 'discount' as const, label: 'Discounts', icon: Star },
    { key: 'free_meal' as const, label: 'Free Meals', icon: Gift },
    { key: 'partner_reward' as const, label: 'Partner Rewards', icon: Trophy }
  ];

  if (userPointsQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loyalty Rewards', headerStyle: { backgroundColor: colors.card } }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your rewards...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ 
        title: 'Loyalty Rewards',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text
      }} />
      
      <View style={[styles.pointsHeader, { backgroundColor: colors.tint }]}>
        <View style={styles.pointsContent}>
          <Zap size={32} color={colors.background} />
          <View style={styles.pointsInfo}>
            <Text style={[styles.pointsValue, { color: colors.background }]}>
              {userPointsQuery.data?.totalPoints || 0}
            </Text>
            <Text style={[styles.pointsLabel, { color: colors.background }]}>EatRate Points</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push('/loyalty/history')}
        >
          <Text style={[styles.historyButtonText, { color: colors.background }]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.key;
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? colors.tint : colors.card,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Icon size={16} color={isSelected ? colors.background : colors.text} />
              <Text style={[
                styles.categoryButtonText,
                { color: isSelected ? colors.background : colors.text }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={rewardsQuery.data?.rewards || []}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.rewardsList}
        showsVerticalScrollIndicator={false}
        refreshing={rewardsQuery.isLoading}
        onRefresh={() => {
          userPointsQuery.refetch();
          rewardsQuery.refetch();
        }}
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