import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { useStorage } from '@/providers/StorageProvider';
import { trpc } from '@/lib/trpc';
import type { AdminUser, AdminNotification } from '@/types/admin';

interface AdminContextValue {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  notifications: AdminNotification[];
  unreadCount: number;
  hasPermission: (permission: string) => boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

const ADMIN_KEY = 'eatrate_admin_user_v1';

// Helper function to map notification types - moved outside component to prevent re-creation
const mapNotificationType = (type: string): 'info' | 'warning' | 'error' | 'success' => {
  switch (type) {
    case 'system':
    case 'user_activity':
      return 'info';
    case 'report':
      return 'warning';
    case 'claim':
      return 'success';
    default:
      return 'info';
  }
};

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
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const storage = useStorage();

  // Admin notifications query - always call hooks, use enabled to control execution
  const notificationsQuery = trpc.admin.dashboard.notifications.useQuery(undefined, {
    enabled: !!adminUser,
    refetchInterval: false, // Disable automatic refetching to prevent infinite loops
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const markNotificationMutation = trpc.admin.dashboard.markNotificationRead.useMutation({
    onSuccess: () => {
      // Use setTimeout to prevent immediate re-render during mutation
      setTimeout(() => {
        notificationsQuery.refetch();
      }, 0);
    },
  });

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

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationMutation.mutateAsync({ notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch {
      // Silently handle notification errors to prevent UI disruption
    }
  }, [markNotificationMutation]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => markNotificationMutation.mutateAsync({ notificationId: id }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // Silently handle bulk notification errors to prevent UI disruption
    }
  }, [notifications, markNotificationMutation]);

  const refreshNotifications = useCallback(() => {
    if (adminUser) {
      notificationsQuery.refetch();
    }
  }, [notificationsQuery, adminUser]);

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
      } catch {
        // Silently handle storage load errors
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

  // Update notifications when query data changes
  useEffect(() => {
    if (notificationsQuery.data) {
      // Map admin notifications to local format for compatibility
      const mappedNotifications = notificationsQuery.data.map((notification: any) => ({
        ...notification,
        type: mapNotificationType(notification.type),
      }));
      
      // Only update if the data has actually changed to prevent infinite re-renders
      setNotifications(prev => {
        // Use a more efficient comparison to prevent unnecessary re-renders
        const prevIds = prev.map(n => n.id).sort().join(',');
        const newIds = mappedNotifications.map((n: any) => n.id).sort().join(',');
        
        if (prevIds === newIds && prev.length === mappedNotifications.length) {
          // Check if read status has changed
          const hasReadStatusChanged = prev.some((prevNotif, index) => {
            const newNotif = mappedNotifications.find((n: any) => n.id === prevNotif.id);
            return newNotif && prevNotif.isRead !== newNotif.isRead;
          });
          
          if (!hasReadStatusChanged) {
            return prev;
          }
        }
        
        return mappedNotifications;
      });
    }
  }, [notificationsQuery.data]);



  return useMemo(() => ({
    adminUser,
    isLoading,
    isAdmin,
    notifications,
    unreadCount,
    hasPermission,
    loginAsAdmin,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
  }), [
    adminUser, 
    isLoading, 
    isAdmin, 
    notifications, 
    unreadCount, 
    hasPermission, 
    loginAsAdmin, 
    logout,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
  ]);
});