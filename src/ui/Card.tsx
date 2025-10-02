import React from 'react';
import { View, ViewProps, ViewStyle, Image, ImageProps } from 'react-native';
import { tokens, shadow } from '../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  const baseStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    ...shadow('md'),
    overflow: 'hidden'
  };

  return (
    <View style={[baseStyle, style]} {...props}>
      {children}
    </View>
  );
};

interface CardImageProps extends ImageProps {
  aspectRatio?: number;
}

export const CardImage: React.FC<CardImageProps> = ({
  aspectRatio = 16 / 9,
  style,
  ...props
}) => {
  return (
    <Image
      style={[
        {
          width: '100%',
          aspectRatio,
          overflow: 'hidden'
        },
        style
      ]}
      resizeMode="cover"
      {...props}
    />
  );
};
