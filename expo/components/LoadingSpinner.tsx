import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors, { gradients } from '@/constants/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  color?: string;
  fullScreen?: boolean;
  showGradient?: boolean;
}

export default function LoadingSpinner({ 
  size = 'large', 
  text = 'Loading...', 
  color = Colors.light.tint,
  fullScreen = true,
  showGradient = false
}: LoadingSpinnerProps) {
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
  const scaleAnim = React.useMemo(() => new Animated.Value(0.8), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const content = (
    <Animated.View 
      style={[
        styles.content, 
        { 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }] 
        }
      ]}
    >
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
      </View>
      {text && (
        <Text style={[styles.text, { color: showGradient ? 'white' : Colors.light.secondary }]}>
          {text}
        </Text>
      )}
    </Animated.View>
  );

  if (showGradient) {
    return (
      <LinearGradient colors={gradients.primary} style={[styles.container, !fullScreen && styles.inline]}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, !fullScreen && styles.inline]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  inline: {
    flex: 0,
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});