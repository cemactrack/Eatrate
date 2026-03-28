import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  testId?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionText,
  onAction,
  testId,
}: EmptyStateProps) {
  const { colors } = useSettings();

  return (
    <View style={styles.container} testID={testId}>
      {Icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
          <Icon size={ICON_SIZES.xl} color={colors.secondary} />
        </View>
      )}
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {subtitle}
        </Text>
      )}
      
      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={onAction}
          activeOpacity={0.8}
          testID={`${testId}-action`}
        >
          <Text style={[styles.actionText, { color: 'white' }]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl * 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});