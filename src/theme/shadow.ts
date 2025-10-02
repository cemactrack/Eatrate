import { Platform, ViewStyle } from 'react-native';

export const shadow = (level: 'sm' | 'md' | 'lg'): ViewStyle => {
  const e = { sm: 2, md: 6, lg: 12 }[level];
  
  if (Platform.OS === 'android') {
    return { elevation: e, shadowColor: '#000' };
  }
  
  const map = {
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 }
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 }
    }
  };
  
  return map[level];
};
