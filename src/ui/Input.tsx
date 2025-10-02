import React from 'react';
import { TextInput, TextInputProps, Platform, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../theme';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  style,
  containerStyle,
  ...props
}) => {
  const baseStyle: TextStyle = {
    fontFamily: tokens.font.family,
    fontSize: tokens.font.size.md,
    color: tokens.colors.text,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: 14,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center'
    } as any)
  };

  return (
    <TextInput
      style={[baseStyle, style]}
      placeholderTextColor={tokens.colors.textDim}
      {...props}
    />
  );
};
