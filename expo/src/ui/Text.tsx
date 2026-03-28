import React from 'react';
import { Text as RNText, TextProps, Platform, TextStyle } from 'react-native';
import { tokens } from '../theme';

type Variant = 'body' | 'label' | 'title' | 'h1' | 'h2';

interface UITextProps extends TextProps {
  variant?: Variant;
  weight?: '400' | '600' | '700';
}

export const UIText: React.FC<UITextProps> = ({ 
  variant = 'body',
  weight,
  style, 
  ...props 
}) => {
  const variantStyles: Record<Variant, TextStyle> = {
    body: {
      fontSize: tokens.font.size.md,
      lineHeight: tokens.font.line.md
    },
    label: {
      fontSize: tokens.font.size.sm,
      lineHeight: tokens.font.line.sm
    },
    title: {
      fontSize: tokens.font.size.lg,
      lineHeight: tokens.font.line.lg,
      fontWeight: '600'
    },
    h2: {
      fontSize: tokens.font.size.h2,
      lineHeight: tokens.font.line.h2,
      fontWeight: '700'
    },
    h1: {
      fontSize: tokens.font.size.h1,
      lineHeight: tokens.font.line.h1,
      fontWeight: '700'
    }
  };

  const baseStyle: TextStyle = {
    fontFamily: tokens.font.family,
    color: tokens.colors.text,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center'
    } as any)
  };

  const weightStyle = weight ? { fontWeight: weight } : {};

  return (
    <RNText
      style={[
        baseStyle,
        variantStyles[variant],
        weightStyle,
        style
      ]}
      {...props}
    />
  );
};
