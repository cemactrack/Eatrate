import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface NotificationToast {
  id: string;
  title: string;
  body: string;
}

export default function ForegroundNotificationHost() {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  const dismissNotification = useCallback((id: string) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    });
  }, [fadeAnim, translateY, setNotifications]);

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
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissNotification(toast.id);
      }, 5000);
    });

    return () => subscription.remove();
  }, [fadeAnim, translateY, dismissNotification]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {notifications.map((notification) => (
        <Animated.View
          key={notification.id}
          style={[
            styles.toast, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY }] 
            }
          ]}
          testID="foreground-notification-toast"
        >
          <View style={styles.iconContainer}>
            <Bell size={20} color={Colors.light.tint} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            {notification.body ? (
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => dismissNotification(notification.id)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'auto',
  },
  toast: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
