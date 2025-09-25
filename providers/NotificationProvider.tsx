import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { AppNotification, NotificationSettings } from '@/types/notifications';
import { useAuth } from './AuthProvider';
import { useRouter } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Fetch notifications
  const notificationsQuery = trpc.notifications.getAll.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch settings
  const settingsQuery = trpc.notifications.getSettings.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

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
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
          });
          setExpoPushToken(token.data);
          
          // Register token with backend
          await registerTokenMutation.mutateAsync({ token: token.data });
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
    }
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
    setIsLoading(notificationsQuery.isLoading || settingsQuery.isLoading);
  }, [notificationsQuery.data, settingsQuery.data, notificationsQuery.isLoading, settingsQuery.isLoading]);

  // Actions
  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteMutation.mutateAsync({ notificationId });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = await updateSettingsMutation.mutateAsync(newSettings);
      setSettings({
        pushEnabled: updated.pushEnabled,
        emailEnabled: updated.emailEnabled,
        categories: {
          social: updated.categories.social ?? false,
          achievements: updated.categories.achievements ?? false,
          events: updated.categories.events ?? false,
          challenges: updated.categories.challenges ?? false,
          restaurants: updated.categories.restaurants ?? false,
          system: updated.categories.system ?? false,
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