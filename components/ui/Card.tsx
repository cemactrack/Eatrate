import React from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  testID,
  variant = 'default',
}) => {
  const { colors } = useSettings();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
      outlined: {
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: 'transparent',
        elevation: 0,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} testID={testID}>
      {children}
    </View>
  );
};

export default Card;