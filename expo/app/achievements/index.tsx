import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Trophy, Star, Users, MapPin, Camera, Heart, MessageSquare, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useSettings } from '@/providers/SettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Achievement, UserStats } from '@/types/restaurant';

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    name: 'First Review',
    description: 'Write your first restaurant review',
    icon: '✍️',
    category: 'reviews',
    requirement: 1,
    points: 10,
    unlockedAt: '2024-01-10T10:30:00Z',
  },
  {
    id: '2',
    name: 'Review Master',
    description: 'Write 50 restaurant reviews',
    icon: '📝',
    category: 'reviews',
    requirement: 50,
    points: 100,
    unlockedAt: '2024-01-15T14:20:00Z',
  },
  {
    id: '3',
    name: 'Social Butterfly',
    description: 'Get 100 followers',
    icon: '🦋',
    category: 'social',
    requirement: 100,
    points: 75,
    unlockedAt: '2024-01-12T16:45:00Z',
  },
  {
    id: '4',
    name: 'Explorer',
    description: 'Visit restaurants in 3 different cities',
    icon: '🗺️',
    category: 'discovery',
    requirement: 3,
    points: 50,
    unlockedAt: '2024-01-08T12:15:00Z',
  },
  {
    id: '5',
    name: 'Photographer',
    description: 'Upload 25 food photos',
    icon: '📸',
    category: 'social',
    requirement: 25,
    points: 40,
  },
  {
    id: '6',
    name: 'Foodie Legend',
    description: 'Reach level 10',
    icon: '👑',
    category: 'special',
    requirement: 10,
    points: 200,
  },
  {
    id: '7',
    name: 'Taste Maker',
    description: 'Get 500 likes on your posts',
    icon: '❤️',
    category: 'social',
    requirement: 500,
    points: 150,
  },
  {
    id: '8',
    name: 'Local Guide',
    description: 'Review 10 restaurants in your city',
    icon: '🏙️',
    category: 'discovery',
    requirement: 10,
    points: 60,
    unlockedAt: '2024-01-14T09:30:00Z',
  },
];

const MOCK_USER_STATS: UserStats = {
  totalReviews: 47,
  totalLikes: 342,
  totalFollowers: 156,
  totalFollowing: 89,
  totalPosts: 73,
  totalBookmarks: 28,
  joinedDate: '2023-11-15T08:00:00Z',
  level: 8,
  points: 1240,
  achievements: MOCK_ACHIEVEMENTS.filter(a => a.unlockedAt),
};

interface AchievementItemProps {
  achievement: Achievement;
  userStats: UserStats;
  onPress: () => void;
}

const AchievementItem = React.memo(function AchievementItem({ achievement, userStats, onPress }: AchievementItemProps) {
  const { colors } = useSettings();
  const isUnlocked = !!achievement.unlockedAt;
  
  const getProgress = () => {
    switch (achievement.category) {
      case 'reviews':
        return Math.min(userStats.totalReviews, achievement.requirement);
      case 'social':
        if (achievement.name.includes('followers')) {
          return Math.min(userStats.totalFollowers, achievement.requirement);
        }
        if (achievement.name.includes('likes')) {
          return Math.min(userStats.totalLikes, achievement.requirement);
        }
        if (achievement.name.includes('photos')) {
          return Math.min(userStats.totalPosts, achievement.requirement);
        }
        return 0;
      case 'discovery':
        if (achievement.name.includes('cities')) {
          return Math.min(3, achievement.requirement); // Mock data
        }
        if (achievement.name.includes('city')) {
          return Math.min(userStats.totalReviews, achievement.requirement);
        }
        return 0;
      case 'special':
        if (achievement.name.includes('level')) {
          return Math.min(userStats.level, achievement.requirement);
        }
        return 0;
      default:
        return 0;
    }
  };
  
  const progress = getProgress();
  const progressPercentage = Math.min((progress / achievement.requirement) * 100, 100);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.achievementItem}>
      <LinearGradient
        colors={isUnlocked ? ['#10B981', '#059669'] : [colors.card, colors.card]}
        style={[styles.achievementCard, { borderColor: isUnlocked ? '#10B981' : colors.border }]}
      >
        <View style={styles.achievementHeader}>
          <View style={[styles.achievementIcon, { backgroundColor: isUnlocked ? 'rgba(255,255,255,0.2)' : colors.accent }]}>
            {isUnlocked ? (
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            ) : (
              <Lock size={24} color={colors.secondary} />
            )}
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementName, { color: isUnlocked ? 'white' : colors.text }]}>
              {achievement.name}
            </Text>
            <Text style={[styles.achievementDescription, { color: isUnlocked ? 'rgba(255,255,255,0.8)' : colors.secondary }]}>
              {achievement.description}
            </Text>
          </View>
          <View style={styles.achievementPoints}>
            <Award size={16} color={isUnlocked ? '#FCD34D' : colors.warning} />
            <Text style={[styles.pointsText, { color: isUnlocked ? '#FCD34D' : colors.warning }]}>
              {achievement.points}
            </Text>
          </View>
        </View>
        
        {!isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                Progress: {progress}/{achievement.requirement}
              </Text>
              <Text style={[styles.progressPercentage, { color: colors.tint }]}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.accent }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: colors.tint,
                  }
                ]} 
              />
            </View>
          </View>
        )}
        
        {isUnlocked && achievement.unlockedAt && (
          <View style={styles.unlockedInfo}>
            <Text style={styles.unlockedText}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function AchievementsScreen() {
  const { colors } = useSettings();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reviews' | 'social' | 'discovery' | 'special'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const userStats = MOCK_USER_STATS;
  const achievements = MOCK_ACHIEVEMENTS;
  
  const filteredAchievements = achievements.filter(achievement => {
    const statusMatch = selectedFilter === 'all' || 
      (selectedFilter === 'unlocked' && achievement.unlockedAt) ||
      (selectedFilter === 'locked' && !achievement.unlockedAt);
    
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    
    return statusMatch && categoryMatch;
  });
  
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalPoints = achievements.filter(a => a.unlockedAt).reduce((sum, a) => sum + a.points, 0);
  
  const handleAchievementPress = useCallback((achievement: Achievement) => {
    console.log('[Achievements] Achievement pressed:', achievement.name);
    // Could show achievement details modal
  }, []);
  
  const filterButtons = [
    { key: 'all' as const, label: 'All', count: achievements.length },
    { key: 'unlocked' as const, label: 'Unlocked', count: unlockedCount },
    { key: 'locked' as const, label: 'Locked', count: achievements.length - unlockedCount },
  ];
  
  const categoryButtons = [
    { key: 'all' as const, label: 'All', icon: Trophy },
    { key: 'reviews' as const, label: 'Reviews', icon: Star },
    { key: 'social' as const, label: 'Social', icon: Users },
    { key: 'discovery' as const, label: 'Discovery', icon: MapPin },
    { key: 'special' as const, label: 'Special', icon: Award },
  ];
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Loading achievements..." />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Achievements',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      {/* Stats Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.statsHeader}>
        <View style={styles.statsContent}>
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Trophy size={24} color="#FCD34D" />
              <Text style={styles.levelText}>Level {userStats.level}</Text>
            </View>
            <Text style={styles.pointsText}>
              {totalPoints.toLocaleString()} points earned
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{unlockedCount}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{achievements.length - unlockedCount}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round((unlockedCount / achievements.length) * 100)}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
              testID={`filter-${filter.key}`}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedFilter === filter.key ? 'white' : colors.text,
                  },
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.3)' : colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    {
                      color: selectedFilter === filter.key ? 'white' : colors.tint,
                    },
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Category Tabs */}
      <View style={[styles.categoryContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categoryButtons.map((category) => {
            const IconComponent = category.icon;
            return (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.key ? colors.accent : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                testID={`category-${category.key}`}
              >
                <IconComponent 
                  size={16} 
                  color={selectedCategory === category.key ? colors.tint : colors.secondary} 
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    {
                      color: selectedCategory === category.key ? colors.tint : colors.secondary,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      {/* Achievements List */}
      {filteredAchievements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Award size={64} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No achievements found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            Try adjusting your filters or start exploring to unlock achievements!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAchievements}
          renderItem={({ item }) => (
            <AchievementItem
              achievement={item}
              userStats={userStats}
              onPress={() => handleAchievementPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  statsContent: {
    gap: 16,
  },
  levelContainer: {
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  levelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  pointsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  filterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  achievementItem: {
    marginBottom: 16,
  },
  achievementCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
    gap: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressContainer: {
    marginTop: 16,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  unlockedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  unlockedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});