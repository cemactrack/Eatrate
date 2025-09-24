import React, { useEffect, useMemo, useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

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

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          setSettingsState(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('[SettingsProvider] load error', e);
      }
    };
    
    // Add small delay to prevent hydration mismatch
    const timeoutId = setTimeout(load, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)).catch((e) =>
        console.error('[SettingsProvider] persist error', e)
      );
      return newSettings;
    });
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    updateSettings({ theme: mode, darkMode: mode === 'dark' });
  }, [updateSettings]);

  return useMemo(() => ({ 
    settings, 
    updateSettings, 
    theme: settings.theme, 
    setTheme 
  }), [settings, updateSettings, setTheme]);
});
