import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface BaseCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  testID?: string;
}

interface InteractiveCardProps extends BaseCardProps {
  onPress: () => void;
  disabled?: boolean;
  activeOpacity?: number;
}

interface StaticCardProps extends BaseCardProps {
  onPress?: never;
  disabled?: never;
  activeOpacity?: never;
}

type CardProps = InteractiveCardProps | StaticCardProps;

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  radius = 'md',
  onPress,
  disabled = false,
  activeOpacity = 0.8,
  testID,
}) => {
  const { colors } = useSettings();

  const getCardStyle = (): ViewStyle => {
    const paddingStyles: Record<CardPadding, ViewStyle> = {
      none: { padding: 0 },
      xs: { padding: 4 },
      sm: { padding: 8 },
      md: { padding: 16 },
      lg: { padding: 24 },
      xl: { padding: 32 },
    };

    const radiusStyles: Record<CardRadius, ViewStyle> = {
      none: { borderRadius: 0 },
      sm: { borderRadius: 6 },
      md: { borderRadius: 12 },
      lg: { borderRadius: 16 },
      xl: { borderRadius: 24 },
      full: { borderRadius: 9999 },
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      },
      elevated: {
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.tint,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return {
      ...paddingStyles[padding],
      ...radiusStyles[radius],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const cardStyle = getCardStyle();

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: activeOpacity },
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

// Compound components for common card patterns
const CardHeader: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.header, style]}>
    {children}
  </View>
);

const CardContent: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.content, style]}>
    {children}
  </View>
);

const CardFooter: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.footer, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
});

// Export compound components
(Card as any).Header = CardHeader;
(Card as any).Content = CardContent;
(Card as any).Footer = CardFooter;

export default Card;
export { CardHeader, CardContent, CardFooter };
export type { CardProps, CardVariant, CardPadding, CardRadius };