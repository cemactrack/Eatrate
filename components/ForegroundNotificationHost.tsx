import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

interface NotificationToast {
  id: string;
  title: string;
  body: string;
}

export default function ForegroundNotificationHost() {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Skip notification listeners on web
      return;
    }

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      
      if (!title && !body) return;
      
      const toast: NotificationToast = {
        id: notification.request.identifier,
        title: title || 'Notification',
        body: body || '',
      };
      
      setNotifications(prev => [...prev, toast]);
      
      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setNotifications(prev => prev.filter(n => n.id !== toast.id));
        });
      }, 4000);
    });

    return () => subscription.remove();
  }, [fadeAnim]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {notifications.map((notification) => (
        <Animated.View
          key={notification.id}
          style={[styles.toast, { opacity: fadeAnim }]}
        >
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          {notification.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 18,
  },
});
