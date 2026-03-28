import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, ICON_SIZES, SHADOWS } from '@/constants/design-tokens';
import Colors from '@/constants/colors';

interface ErrorToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorToast({
  message,
  visible,
  onDismiss,
  duration = 4000,
  type = 'error',
}: ErrorToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const colors = {
    error: {
      background: Colors.light.error,
      text: 'white',
      icon: 'white',
    },
    warning: {
      background: Colors.light.warning,
      text: 'white',
      icon: 'white',
    },
    info: {
      background: Colors.light.tint,
      text: 'white',
      icon: 'white',
    },
  };

  const currentColors = colors[type];

  const handleDismiss = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, handleDismiss]);

  if (!visible && translateY._value === -100) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.sm,
          transform: [{ translateY }],
          opacity,
          backgroundColor: currentColors.background,
        },
        SHADOWS.lg,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <AlertCircle size={ICON_SIZES.md} color={currentColors.icon} />
        <Text style={[styles.message, { color: currentColors.text }]} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={ICON_SIZES.sm} color={currentColors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    borderRadius: BORDER_RADIUS.md,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 20,
  },
  closeButton: {
    padding: SPACING.xs,
  },
});