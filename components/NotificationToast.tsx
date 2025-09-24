import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react-native';
import Colors from '@/constants/colors';



export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface NotificationToastProps {
  type: ToastType;
  title: string;
  message?: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        color: Colors.light.success,
        backgroundColor: '#F0FDF4',
        borderColor: Colors.light.success,
      };
    case 'error':
      return {
        icon: XCircle,
        color: Colors.light.error,
        backgroundColor: '#FEF2F2',
        borderColor: Colors.light.error,
      };
    case 'warning':
      return {
        icon: AlertCircle,
        color: Colors.light.warning,
        backgroundColor: '#FFFBEB',
        borderColor: Colors.light.warning,
      };
    case 'info':
    default:
      return {
        icon: Info,
        color: Colors.light.tint,
        backgroundColor: Colors.light.accent,
        borderColor: Colors.light.tint,
      };
  }
};

export default function NotificationToast({
  type,
  title,
  message,
  visible,
  onDismiss,
  duration = 4000,
}: NotificationToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getToastConfig(type);
  const IconComponent = config.icon;

  const handleDismiss = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, handleDismiss, translateY, opacity]);



  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconComponent size={20} color={config.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>{title}</Text>
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={Colors.light.secondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    marginTop: 2,
  },
});