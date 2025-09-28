import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import NotificationToast from '@/components/NotificationToast';
import { useAuth } from '@/providers/AuthProvider';

interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export default function ForegroundNotificationHost() {
  const { user } = useAuth();
  const [visible, setVisible] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const hasShownDeniedRef = useRef<boolean>(false);

  const showToast = useMemo(
    () => (next: ToastState) => {
      setToast(next);
      setVisible(true);
    },
    [],
  );

  useEffect(() => {
    if (!user) return;
    if (Platform.OS === 'web') return;

    let subscription: Notifications.Subscription | null = null;

    const setup = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted' && !hasShownDeniedRef.current) {
          hasShownDeniedRef.current = true;
          showToast({
            type: 'warning',
            title: 'Notifications disabled',
            message: 'Enable push in system settings to receive updates.',
          });
        }
      } catch (e) {
        console.log('[ForegroundNotificationHost] permissions check failed', e);
      }

      subscription = Notifications.addNotificationReceivedListener((n) => {
        try {
          const title = n.request.content.title ?? 'Notification';
          const body = n.request.content.body ?? undefined;
          showToast({ type: 'info', title, message: body });
        } catch (e) {
          console.log('[ForegroundNotificationHost] failed to render toast for notification', e);
        }
      });
    };

    setup();

    return () => {
      if (subscription) Notifications.removeNotificationSubscription(subscription);
    };
  }, [user, showToast]);

  if (!toast) return null;

  return (
    <NotificationToast
      testID="foreground-notification-toast"
      type={toast.type}
      title={toast.title}
      message={toast.message}
      visible={visible}
      onDismiss={() => setVisible(false)}
      duration={4000}
    />
  );
}
