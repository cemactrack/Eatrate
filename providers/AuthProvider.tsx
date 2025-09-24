import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { useStorage } from '@/providers/StorageProvider';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<AuthUser, 'displayName' | 'avatar'>>) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_KEY = 'eatrate_auth_user_v1';

export const [AuthProvider, useAuthInternal] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const storage = useStorage();

  const persist = useCallback(async (next: AuthUser | null) => {
    if (!next) {
      await storage.removeItem(AUTH_KEY);
      return;
    }
    await storage.setItem(AUTH_KEY, JSON.stringify(next));
  }, [storage]);

  const loginWithEmail = useCallback(async (email: string) => {
    if (!email?.trim() || email.length > 100) return;
    const sanitizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    const newUser: AuthUser = {
      id: `email_${Date.now()}`,
      email: sanitizedEmail,
      displayName: sanitizedEmail.split('@')[0],
      avatar: 'https://images.unsplash.com/photo-1544435253-f0ead49638b9?w=200&h=200&fit=crop',
    };
    setUser(newUser);
    await persist(newUser);
  }, [persist]);

  const loginWithPhone = useCallback(async (phone: string) => {
    if (!phone?.trim() || phone.length > 20) return;
    const cleaned = phone.trim().replace(/[^\d+]/g, '');
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(cleaned)) {
      Alert.alert('Invalid phone', 'Enter a valid phone number with country code, e.g. +14155552671');
      return;
    }
    const newUser: AuthUser = {
      id: `phone_${Date.now()}`,
      phone: cleaned,
      displayName: cleaned,
      avatar: 'https://images.unsplash.com/photo-1542902093-4b6b6c0b9c39?w=200&h=200&fit=crop',
    };
    setUser(newUser);
    await persist(newUser);
  }, [persist]);

  const updateProfile = useCallback(async (patch: Partial<Pick<AuthUser, 'displayName' | 'avatar'>>) => {
    try {
      setUser((prev) => {
        const next = prev ? { ...prev, ...patch } : prev;
        return next;
      });
      const current = await storage.getItem(AUTH_KEY);
      const parsed: AuthUser | null = current ? JSON.parse(current) : null;
      const next = parsed ? { ...parsed, ...patch } : parsed;
      await storage.setItem(AUTH_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('[AuthProvider] updateProfile error', e);
    }
  }, [storage]);

  const logout = useCallback(async () => {
    setUser(null);
    await persist(null);
  }, [persist]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        const stored = await storage.getItem(AUTH_KEY);
        if (isMounted && stored) {
          const parsed: AuthUser = JSON.parse(stored);
          if (parsed) {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.error('[AuthProvider] load error', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [storage]);

  return useMemo(() => ({
    user,
    isLoading,
    loginWithEmail,
    loginWithPhone,
    updateProfile,
    logout,
  }), [user, isLoading, loginWithEmail, loginWithPhone, updateProfile, logout]);
});

export const useAuth = (): AuthContextValue | null => {
  try {
    const context = useAuthInternal();
    return context || null;
  } catch (error) {
    console.error('[useAuth] Context error:', error);
    return null;
  }
};
