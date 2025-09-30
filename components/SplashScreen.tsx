import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChefHat, 
  Utensils, 
  Coffee, 
  Pizza, 
  Star, 
  Wine,
  UtensilsCrossed
} from 'lucide-react-native';



interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [iconAnims] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const handleFinish = useCallback(() => {
    if (onFinish) {
      onFinish();
    }
  }, [onFinish]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.stagger(200, 
        iconAnims.map((anim, index) => {
          if (!anim) return Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, useNativeDriver: true });
          return Animated.spring(anim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          });
        })
      ),
    ]).start();

    // Auto finish after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        handleFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, iconAnims, handleFinish]);

  const getIconStyles = useCallback(() => ({
    icon1: { position: 'absolute' as const, top: height * 0.15, left: width * 0.1 },
    icon2: { position: 'absolute' as const, top: height * 0.2, right: width * 0.15 },
    icon3: { position: 'absolute' as const, top: height * 0.35, left: width * 0.05 },
    icon4: { position: 'absolute' as const, top: height * 0.65, right: width * 0.1 },
    icon5: { position: 'absolute' as const, bottom: height * 0.25, left: width * 0.15 },
    icon6: { position: 'absolute' as const, bottom: height * 0.3, right: width * 0.05 },
    icon7: { position: 'absolute' as const, top: height * 0.45, right: width * 0.08 },
  }), [width, height]);

  const iconStyles = getIconStyles();
  const icons = [
    { Icon: ChefHat, style: iconStyles.icon1, id: 'chef-hat' },
    { Icon: Utensils, style: iconStyles.icon2, id: 'utensils' },
    { Icon: Coffee, style: iconStyles.icon3, id: 'coffee' },
    { Icon: Pizza, style: iconStyles.icon4, id: 'pizza' },
    { Icon: Star, style: iconStyles.icon5, id: 'star' },
    { Icon: Wine, style: iconStyles.icon6, id: 'wine' },
    { Icon: UtensilsCrossed, style: iconStyles.icon7, id: 'utensils-crossed' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#FF6B35', '#FF8E53', '#D32F2F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Background Icons */}
        {icons.map(({ Icon, style, id }, index) => (
          <Animated.View
            key={id}
            style={[
              style,
              {
                opacity: iconAnims[index],
                transform: [
                  {
                    scale: iconAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Icon size={40} color="rgba(255, 255, 255, 0.3)" />
          </Animated.View>
        ))}

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Utensils size={60} color="#FFFFFF" />
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>Eatrate</Text>
          
          {/* Tagline */}
          <Text style={styles.tagline}>Food Rating Platform</Text>

          {/* Rating Stars */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Animated.View
                key={star}
                style={[styles.starOpacity, {
                  opacity: iconAnims[star % iconAnims.length],
                }]}
              >
                <Star size={20} color="#FFD700" fill="#FFD700" />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width - 80],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '300',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    right: 40,
  },
  loadingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  starOpacity: {
    // Base style for star opacity animation
  },
});