import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthProvider';
import { trpc } from '@/lib/trpc';

interface NotificationContextValue {
  pushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
  registerPushToken: () => Promise<void>;
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const [NotificationProvider, useNotificationInternal] = createContextHook<NotificationContextValue>(() => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
    try {
      console.log('[Notifications] Requesting permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('[Notifications] Permission granted');
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request notification permission');
    }
  }, []);

  const registerPushToken = useCallback(async () => {
    try {
      if (!user) {
        console.log('[Notifications] No user logged in, skipping token registration');
        return;
      }

      if (permissionStatus !== 'granted') {
        console.log('[Notifications] Permission not granted, skipping token registration');
        return;
      }

      console.log('[Notifications] Getting push token...');
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'xpwqdc41xc47biu2xqpo4',
      });
      
      const tokenString = token.data;
      setPushToken(tokenString);
      console.log('[Notifications] Got push token:', tokenString);
      
      // Save token to database
      try {
        await updatePushTokenMutation.mutateAsync({ pushToken: tokenString });
        console.log('[Notifications] Successfully saved push token to database');
      } catch (saveError) {
        console.error('[Notifications] Failed to save push token to database:', saveError);
      }
      
    } catch (error) {
      console.error('[Notifications] Error getting push token:', error);
      Alert.alert('Error', 'Failed to register for push notifications');
    }
  }, [user, permissionStatus, updatePushTokenMutation]);

  // Initialize notifications on mount
  useEffect(() => {
    let active = true;
    
    const init = async () => {
      try {
        // Check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        if (active) {
          setPermissionStatus(status);
          console.log('[Notifications] Current permission status:', status);
        }
      } catch (error) {
        console.error('[Notifications] Error checking permissions:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    init();
    
    return () => {
      active = false;
    };
  }, []);

  // Auto-request permission and register token after login
  useEffect(() => {
    if (user && !loading) {
      if (permissionStatus === null || permissionStatus === 'undetermined') {
        // First time after login, request permission
        console.log('[Notifications] First login detected, requesting permission');
        requestPermission();
      } else if (permissionStatus === 'granted' && !pushToken) {
        // Permission granted but no token yet
        console.log('[Notifications] Permission granted, registering push token');
        registerPushToken();
      }
    }
  }, [user, loading, permissionStatus, pushToken, requestPermission, registerPushToken]);

  // Set up notification listeners
  useEffect(() => {
    // Handle notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received in foreground:', notification);
      
      // The ForegroundNotificationHost component will handle displaying the notification
      // It listens to the same event and shows a toast-like UI
      const { title, body } = notification.request.content;
      console.log('[Notifications] Foreground notification:', { title, body });
    });

    // Handle notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] User tapped notification:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        console.log('[Notifications] Should navigate to:', data.screen);
        // Add navigation logic here if needed
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return useMemo(() => ({
    pushToken,
    permissionStatus,
    loading,
    requestPermission,
    registerPushToken,
  }), [pushToken, permissionStatus, loading, requestPermission, registerPushToken]);
});

export const useNotifications = (): NotificationContextValue => {
  const ctx = useNotificationInternal();
  return ctx;
};
