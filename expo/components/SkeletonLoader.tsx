import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = BORDER_RADIUS.sm,
  style 
}: SkeletonLoaderProps) {
  const { colors } = useSettings();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// Skeleton components for common UI patterns
export function RestaurantCardSkeleton() {
  const { colors } = useSettings();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <SkeletonLoader height={200} borderRadius={BORDER_RADIUS.lg} style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.header}>
          <SkeletonLoader width="70%" height={18} />
          <SkeletonLoader width={40} height={24} borderRadius={BORDER_RADIUS.sm} />
        </View>
        <SkeletonLoader width="50%" height={14} style={styles.marginTopXs} />
        <View style={styles.ratingRow}>
          <SkeletonLoader width={80} height={14} />
          <SkeletonLoader width={60} height={14} />
        </View>
        <View style={styles.footer}>
          <SkeletonLoader width="40%" height={12} />
          <SkeletonLoader width={50} height={20} borderRadius={BORDER_RADIUS.md} />
        </View>
      </View>
    </View>
  );
}

export function PostCardSkeleton() {
  const { colors } = useSettings();
  
  return (
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <SkeletonLoader height={200} borderRadius={BORDER_RADIUS.md} style={styles.postImageSkeleton} />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <SkeletonLoader width={32} height={32} borderRadius={16} />
          <View style={styles.postUserInfo}>
            <SkeletonLoader width={120} height={14} />
            <SkeletonLoader width={80} height={12} style={styles.marginTopXs} />
          </View>
        </View>
        <SkeletonLoader width="90%" height={14} style={styles.marginTopSm} />
        <SkeletonLoader width="60%" height={14} style={styles.marginTopXs} />
        <View style={styles.postStats}>
          <SkeletonLoader width={60} height={12} />
          <SkeletonLoader width={80} height={12} />
        </View>
      </View>
    </View>
  );
}

export function UserCardSkeleton() {
  const { colors } = useSettings();
  
  return (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <SkeletonLoader width={60} height={60} borderRadius={30} />
      <SkeletonLoader width={100} height={14} style={styles.marginTopSm} />
      <SkeletonLoader width={80} height={12} style={styles.marginTopXs} />
      <SkeletonLoader width={60} height={24} borderRadius={BORDER_RADIUS.xl} style={styles.marginTopSm} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
  imageSkeleton: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  postCard: {
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  postImageSkeleton: {
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  postContent: {
    padding: SPACING.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  postStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  userCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 140,
  },
  marginTopXs: {
    marginTop: SPACING.xs,
  },
  marginTopSm: {
    marginTop: SPACING.sm,
  },
});