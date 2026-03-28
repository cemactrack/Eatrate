import React from 'react';
import { Pressable, PressableProps, ViewStyle, Platform } from 'react-native';
import { tokens, shadow } from '../theme';
import { UIText } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  children: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  style,
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: tokens.colors.primary,
      ...shadow('md')
    },
    secondary: {
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      ...shadow('sm')
    },
    ghost: {
      backgroundColor: 'transparent'
    }
  };

  const baseStyle: ViewStyle = {
    borderRadius: tokens.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1
  };

  const textColor = variant === 'ghost' || variant === 'secondary' 
    ? tokens.colors.text 
    : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [
        baseStyle,
        variantStyles[variant],
        pressed && { opacity: 0.8 },
        style
      ]}
      disabled={disabled}
      android_ripple={{
        color: '#ffffff22',
        borderless: false
      }}
      {...props}
    >
      <UIText
        variant="body"
        weight="600"
        style={{ color: textColor }}
      >
        {children}
      </UIText>
    </Pressable>
  );
};
