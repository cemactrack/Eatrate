import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { useStorage } from '@/providers/StorageProvider';
import type { AdminUser, AdminPermission } from '@/types/admin';

interface AdminContextValue {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ADMIN_KEY = 'eatrate_admin_user_v1';

const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_1',
    email: 'admin@eatrate.com',
    displayName: 'Super Admin',
    role: 'super_admin',
    permissions: [
      { id: '1', name: 'manage_users', description: 'Manage user accounts', category: 'users' },
      { id: '2', name: 'manage_restaurants', description: 'Manage restaurants', category: 'restaurants' },
      { id: '3', name: 'moderate_content', description: 'Moderate posts and comments', category: 'posts' },
      { id: '4', name: 'view_analytics', description: 'View platform analytics', category: 'analytics' },
      { id: '5', name: 'manage_system', description: 'Manage system settings', category: 'system' },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'admin_2',
    email: 'moderator@eatrate.com',
    displayName: 'Content Moderator',
    role: 'moderator',
    permissions: [
      { id: '3', name: 'moderate_content', description: 'Moderate posts and comments', category: 'posts' },
      { id: '6', name: 'view_reports', description: 'View user reports', category: 'comments' },
    ],
    createdAt: '2023-06-01T00:00:00Z',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isActive: true,
  },
];

export const [AdminProvider, useAdmin] = createContextHook<AdminContextValue>(() => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const storage = useStorage();

  const persist = useCallback(async (admin: AdminUser | null) => {
    if (!admin) {
      await storage.removeItem(ADMIN_KEY);
      return;
    }
    await storage.setItem(ADMIN_KEY, JSON.stringify(admin));
  }, [storage]);

  const loginAsAdmin = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    const mockAdmin = MOCK_ADMIN_USERS.find(admin => admin.email === email.trim());
    
    if (!mockAdmin || password !== 'admin123') {
      Alert.alert('Error', 'Invalid credentials.');
      return;
    }

    if (!mockAdmin.isActive) {
      Alert.alert('Error', 'Admin account is deactivated.');
      return;
    }

    const updatedAdmin = {
      ...mockAdmin,
      lastLoginAt: new Date().toISOString(),
    };

    setAdminUser(updatedAdmin);
    await persist(updatedAdmin);
  }, [persist]);

  const logout = useCallback(async () => {
    setAdminUser(null);
    await persist(null);
  }, [persist]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true;
    return adminUser.permissions.some(p => p.name === permission);
  }, [adminUser]);

  const isAdmin = useMemo(() => adminUser !== null, [adminUser]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        const stored = await storage.getItem(ADMIN_KEY);
        if (isMounted && stored) {
          const parsed: AdminUser = JSON.parse(stored);
          if (parsed.isActive) {
            setAdminUser(parsed);
          }
        }
      } catch (e) {
        console.error('[AdminProvider] load error', e);
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
    adminUser,
    isLoading,
    isAdmin,
    hasPermission,
    loginAsAdmin,
    logout,
  }), [adminUser, isLoading, isAdmin, hasPermission, loginAsAdmin, logout]);
});