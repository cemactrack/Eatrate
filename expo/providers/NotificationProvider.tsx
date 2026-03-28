import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthProvider';
import { trpc } from '@/lib/trpc';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface NotificationContextValue {
  expoPushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<void>;
  loading: boolean;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationContextValue>(() => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  
  const updatePushTokenMutation = trpc.auth.updatePushToken.useMutation({
    onSuccess: () => {
      console.log('[Notifications] Push token saved to database');
    },
    onError: (error) => {
      console.error('[Notifications] Failed to save push token:', error);
    },
  });

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Push notifications not supported on web');
      return;
    }

    setLoading(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setPermissionStatus(finalStatus);
      
      if (finalStatus === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        
        console.log('[Notifications] Expo push token:', token.data);
        setExpoPushToken(token.data);
        
        // Save token to database if user is logged in
        if (user && token.data) {
          updatePushTokenMutation.mutate({ pushToken: token.data });
        }
      } else {
        console.log('[Notifications] Permission denied');
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      Alert.alert('Error', 'Failed to setup notifications');
    } finally {
      setLoading(false);
    }
  }, [user, updatePushTokenMutation]);

  // Setup notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Handle notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received in foreground:', notification);
      // Show a simple toast/alert for foreground notifications
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || 'You have a new notification',
        [{ text: 'OK' }]
      );
    });

    // Handle notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] User tapped notification:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to specific screen based on notification data
        console.log('[Notifications] Should navigate to:', data.screen);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Request permission after user logs in
  useEffect(() => {
    if (user && !expoPushToken && Platform.OS !== 'web') {
      // Small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        requestPermission();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, expoPushToken, requestPermission]);

  return {
    expoPushToken,
    permissionStatus,
    requestPermission,
    loading,
  };
});