import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { AppNotification, NotificationSettings } from '@/types/notifications';
import { useAuth } from './AuthProvider';
import { useRouter } from 'expo-router';

// Configure notification behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  isLoading: boolean;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  
  // Helpers
  getUnreadNotifications: () => AppNotification[];
  getNotificationsByType: (type: AppNotification['type']) => AppNotification[];
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationContextType>(() => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Fetch notifications
  const notificationsQuery = trpc.notifications.getAll.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry if it's a server configuration error
      if (error.message.includes('Server returned HTML') || error.message.includes('Network error')) {
        console.log('[NotificationProvider] Not retrying due to server/network error');
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch settings
  const settingsQuery = trpc.notifications.getSettings.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a server configuration error
      if (error.message.includes('Server returned HTML') || error.message.includes('Network error')) {
        console.log('[NotificationProvider] Not retrying settings due to server/network error');
        return false;
      }
      return failureCount < 3;
    },
  });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();
  const updateSettingsMutation = trpc.notifications.updateSettings.useMutation();
  const registerTokenMutation = trpc.notifications.registerPushToken.useMutation();

  // Initialize push notifications
  useEffect(() => {
    if (!user) return;

    const initializePushNotifications = async () => {
      try {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Push notification permissions not granted');
          return;
        }

        // Get push token
        if (Platform.OS !== 'web') {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || undefined,
          });
          setExpoPushToken(token.data);
          
          // Register token with backend
          registerTokenMutation.mutate({ token: token.data });
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initializePushNotifications();
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Refresh notifications list
      notificationsQuery.refetch();
    });

    // Listen for user tapping on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification tap navigation
  const handleNotificationTap = (data: any) => {
    if (data?.actionUrl) {
      router.push(data.actionUrl);
    } else if (data?.type) {
      // Navigate based on notification type
      switch (data.type) {
        case 'like':
        case 'comment':
          if (data.postId) router.push(`/posts/${data.postId}`);
          break;
        case 'follow':
          if (data.userId) router.push(`/users/${data.userId}`);
          break;
        case 'achievement':
          router.push('/achievements');
          break;
        case 'event':
          router.push('/events');
          break;
        default:
          router.push('/(tabs)/(home)/home');
      }
    }
  };

  // Update state when queries complete
  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    } else if (notificationsQuery.error && notifications.length === 0) {
      // Provide fallback mock data if server is not available
      console.log('[NotificationProvider] Using fallback notification data due to server error');
      setNotifications([
        {
          id: 'fallback-1',
          type: 'system' as const,
          title: 'Server Unavailable',
          message: 'Unable to connect to notification server. Please check your connection.',
          imageUrl: undefined,
          data: {},
          userId: 'current-user',
          isRead: false,
          createdAt: new Date(),
          actionUrl: undefined,
          priority: 'normal' as const,
          category: 'system',
        },
      ]);
    }
    
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    } else if (settingsQuery.error && !settings) {
      // Provide fallback settings if server is not available
      console.log('[NotificationProvider] Using fallback notification settings due to server error');
      setSettings({
        pushEnabled: true,
        emailEnabled: false,
        categories: {
          social: true,
          achievements: true,
          events: true,
          challenges: true,
          restaurants: true,
          system: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
        },
        frequency: {
          instant: true,
          daily: false,
          weekly: false,
        },
      });
    }
    
    setIsLoading(notificationsQuery.isLoading || settingsQuery.isLoading);
  }, [notificationsQuery.data, settingsQuery.data, notificationsQuery.isLoading, settingsQuery.isLoading, notificationsQuery.error, settingsQuery.error, notifications.length, settings]);

  // Actions
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI first
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Then try to sync with server
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: false } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    // Store previous state for potential rollback
    const previousNotifications = [...notifications];
    
    try {
      // Optimistically update UI first
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Then try to sync with server
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert optimistic update on error
      setNotifications(previousNotifications);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Store the notification for potential rollback
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    try {
      // Optimistically update UI first
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Then try to sync with server
      await deleteMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert optimistic update on error
      if (notificationToDelete) {
        setNotifications(prev => [...prev, notificationToDelete]);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = await updateSettingsMutation.mutateAsync(newSettings);
      setSettings({
        pushEnabled: updated.pushEnabled,
        emailEnabled: updated.emailEnabled,
        categories: {
          social: updated.categories?.social ?? false,
          achievements: updated.categories?.achievements ?? false,
          events: updated.categories?.events ?? false,
          challenges: updated.categories?.challenges ?? false,
          restaurants: updated.categories?.restaurants ?? false,
          system: updated.categories?.system ?? false,
        },
        quietHours: {
          enabled: updated.quietHours?.enabled ?? false,
          startTime: updated.quietHours?.startTime ?? '22:00',
          endTime: updated.quietHours?.endTime ?? '08:00',
        },
        frequency: {
          instant: updated.frequency?.instant ?? true,
          daily: updated.frequency?.daily ?? false,
          weekly: updated.frequency?.weekly ?? false,
        },
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return false;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  };

  // Helpers
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const getUnreadNotifications = () => notifications.filter(n => !n.isRead);
  
  const getNotificationsByType = (type: AppNotification['type']) => 
    notifications.filter(n => n.type === type);

  return {
    notifications,
    unreadCount,
    settings,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    requestPermissions,
    getUnreadNotifications,
    getNotificationsByType,
  };
});