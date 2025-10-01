import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthProvider';
import { trpc } from '@/lib/trpc';
import NotificationToast, { ToastType } from '@/components/NotificationToast';

interface PushNotificationContextValue {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<void>;
  isLoading: boolean;
  ToastComponent: React.ReactNode;
}

const isExpoGo = () => {
  return (Constants.appOwnership === 'expo') || (Constants.executionEnvironment === 'storeClient');
};

const canUseNotifications = () => {
  if (Platform.OS === 'web') return false;
  if (isExpoGo()) return false;
  if (!Device.isDevice) return false;
  return true;
};

if (canUseNotifications()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('[Push Notifications] Failed to set notification handler:', error);
  }
}

export const [PushNotificationProvider, usePushNotifications] = createContextHook<PushNotificationContextValue>(() => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: ToastType; visible: boolean } | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  const { user } = useAuth();
  const updatePushTokenMutation = trpc.auth.updatePushToken.useMutation();

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    if (!title?.trim()) return;
    setToast({ title: title.trim(), message: message?.trim(), type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | null> => {
    if (!canUseNotifications()) {
      if (Platform.OS === 'web') {
        console.log('[Push Notifications] Web platform - push notifications not supported');
      } else if (isExpoGo()) {
        console.warn('[Push Notifications] Expo Go detected (SDK 53): remote push is not supported in Expo Go. Use a development build.');
      } else if (!Device.isDevice) {
        console.log('[Push Notifications] Must use physical device for Push Notifications');
      }
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      setPermissionStatus(existingStatus);
      console.log('[Push Notifications] Current permission status:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(status);
        console.log('[Push Notifications] New permission status:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('[Push Notifications] Permission denied');
        showToast('Notifications permission denied', 'Enable in Settings to receive notifications', 'warning');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      
      console.log('[Push Notifications] Expo push token obtained:', token.data);
      return token.data;
    } catch (error) {
      console.error('[Push Notifications] Error getting push token:', error);
      showToast('Failed to register for push', 'Please try again later', 'error');
      return null;
    }
  }, [showToast]);

  const requestPermission = useCallback(async () => {
    if (!user) {
      console.log('[Push Notifications] No user authenticated - skipping permission request');
      return;
    }

    setIsLoading(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        
        // Send token to server
        await updatePushTokenMutation.mutateAsync({ pushToken: token });
        console.log('[Push Notifications] Token registered with server successfully');
      }
    } catch (error) {
      console.error('[Push Notifications] Error during permission request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, registerForPushNotificationsAsync, updatePushTokenMutation]);

  // Initialize push notifications when user logs in
  useEffect(() => {
    if (user && !expoPushToken && canUseNotifications()) {
      console.log('[Push Notifications] User authenticated - requesting push notification permission');
      requestPermission();
    }
  }, [user, expoPushToken, requestPermission]);

  // Set up notification listeners
  useEffect(() => {
    if (!canUseNotifications()) {
      return;
    }

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (!notification?.request?.content) {
        console.warn('[Push Notifications] Invalid notification received');
        return;
      }
      
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      
      if (!title?.trim() && !body?.trim()) {
        console.warn('[Push Notifications] Notification has no valid content');
        return;
      }
      
      console.log('[Push Notifications] Notification received in foreground:', notification);
      setNotification(notification);
      
      // Show a toast for foreground notifications
      showToast(
        title?.trim() || 'Notification',
        body?.trim() || 'You have a new notification',
        'info'
      );
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (!response?.notification?.request?.content) {
        console.warn('[Push Notifications] Invalid notification response received');
        return;
      }
      
      console.log('[Push Notifications] Notification response received:', response);
      // Handle notification tap - could navigate to specific screen
      const data = response.notification.request.content.data;
      if (data?.screen && typeof data.screen === 'string' && data.screen.trim()) {
        console.log('[Push Notifications] Should navigate to:', data.screen.trim());
        // TODO: Add navigation logic here if needed
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [showToast]);

  // Clear token when user logs out
  useEffect(() => {
    if (!user && expoPushToken) {
      console.log('[Push Notifications] User logged out - clearing push token');
      setExpoPushToken(null);
      setNotification(null);
      setPermissionStatus(null);
    }
  }, [user, expoPushToken]);

  return useMemo(() => ({
    expoPushToken,
    notification,
    permissionStatus,
    requestPermission,
    isLoading,
    ToastComponent: toast ? (
      <NotificationToast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
      />
    ) : null,
  }), [expoPushToken, notification, permissionStatus, requestPermission, isLoading, toast, hideToast]);
});

export const usePushNotificationToken = () => {
  const { expoPushToken } = usePushNotifications();
  return expoPushToken;
};

export const usePushNotificationPermission = () => {
  const { permissionStatus, requestPermission, isLoading } = usePushNotifications();
  return { permissionStatus, requestPermission, isLoading };
};