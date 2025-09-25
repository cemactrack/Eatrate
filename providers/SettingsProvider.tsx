import { useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useStorage } from '@/providers/StorageProvider';
import Colors, { AppColors } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface AppSettings {
  theme: ThemeMode;
  notifications: boolean;
  darkMode: boolean;
  locationEnabled: boolean;
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolvedTheme: ResolvedTheme;
  colors: AppColors;
}

const STORAGE_KEY = 'eatrate_settings_v1';

const defaultSettings: AppSettings = {
  theme: 'light',
  notifications: true,
  darkMode: false,
  locationEnabled: true,
};

export const [SettingsProvider, useSettings] = createContextHook<SettingsContextValue>(() => {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const storage = useStorage();
  const deviceScheme = useColorScheme();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const raw = await storage.getItem(STORAGE_KEY);
        if (isMounted && raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          if (parsed && Object.keys(parsed).length > 0) {
            setSettingsState(prev => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {
        console.error('[SettingsProvider] load error', e);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [storage]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates };
      storage.setItem(STORAGE_KEY, JSON.stringify(newSettings)).catch((e: any) =>
        console.error('[SettingsProvider] persist error', e)
      );
      return newSettings;
    });
  }, [storage]);

  const setTheme = useCallback((mode: ThemeMode) => {
    updateSettings({ theme: mode, darkMode: mode === 'dark' });
  }, [updateSettings]);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (settings.theme === 'system') {
      return (deviceScheme === 'dark' ? 'dark' : 'light');
    }
    return settings.theme === 'dark' ? 'dark' : 'light';
  }, [settings.theme, deviceScheme]);

  const colors: AppColors = useMemo(() => Colors[resolvedTheme], [resolvedTheme]);

  return useMemo(() => ({ 
    settings,
    updateSettings,
    theme: settings.theme,
    setTheme,
    resolvedTheme,
    colors,
  }), [settings, updateSettings, setTheme, resolvedTheme, colors]);
});