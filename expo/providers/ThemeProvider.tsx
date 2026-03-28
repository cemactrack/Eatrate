import { useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useStorage } from './StorageProvider';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Accent colors
    accent: string;
    success: string;
    warning: string;
    error: string;
    
    // Border colors
    border: string;
    borderLight: string;
    
    // Status colors
    active: string;
    inactive: string;
    
    // Overlay colors
    overlay: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
}

const lightTheme: Theme = {
  colors: {
    background: '#ffffff',
    surface: '#f8f9fa',
    card: '#ffffff',
    
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    primary: '#007AFF',
    primaryLight: '#4DA3FF',
    primaryDark: '#0056CC',
    
    accent: '#FF6B35',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    
    border: '#e1e5e9',
    borderLight: '#f0f0f0',
    
    active: '#007AFF',
    inactive: '#8E8E93',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    background: '#000000',
    surface: '#1c1c1e',
    card: '#2c2c2e',
    
    text: '#ffffff',
    textSecondary: '#ebebf5',
    textMuted: '#8e8e93',
    
    primary: '#0A84FF',
    primaryLight: '#4DA3FF',
    primaryDark: '#0056CC',
    
    accent: '#FF6B35',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    
    border: '#38383a',
    borderLight: '#48484a',
    
    active: '#0A84FF',
    inactive: '#8E8E93',
    
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const STORAGE_KEY = 'app_theme_mode';

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextType>(() => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();
  const { getItem, setItem } = useStorage();

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Get the current theme
  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // Initialize theme from storage
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedThemeMode = await getItem(STORAGE_KEY);
        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, [getItem]);

  // Set theme mode and persist to storage
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, [setItem]);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  }, [isDark, setThemeMode]);

  return {
    theme,
    themeMode,
    isDark,
    isLoading,
    setThemeMode,
    toggleTheme,
  };
});

// Hook for creating themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme), [theme, createStyles]);
};