import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, Utensils, Heart, ArrowRight } from 'lucide-react-native';
import Colors, { gradients } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
  const slideAnim = React.useMemo(() => new Animated.Value(50), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const navigateToLogin = () => {
    router.push('/login' as const);
  };

  const navigateToSignup = () => {
    router.push('/signup' as const);
  };

  return (
    <LinearGradient colors={gradients.primary} style={styles.gradient}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <ChefHat size={48} color="white" />
              </View>
              <View style={[styles.iconWrapper, styles.iconWrapperSecondary]}>
                <Utensils size={32} color={Colors.light.tint} />
              </View>
              <View style={[styles.iconWrapper, styles.iconWrapperTertiary]}>
                <Heart size={28} color="white" />
              </View>
            </View>
            
            <Text style={styles.appName}>EatRate</Text>
            <Text style={styles.tagline}>Discover amazing flavors,{'\n'}share culinary adventures</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <View style={[styles.feature, Platform.select({ web: { backdropFilter: 'blur(10px)' } as any, default: {} })]}>
              <View style={styles.featureIcon}>
                <ChefHat size={24} color={Colors.light.tint} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Discover Restaurants</Text>
                <Text style={styles.featureDescription}>Find the best local spots and hidden gems</Text>
              </View>
            </View>
            
            <View style={[styles.feature, Platform.select({ web: { backdropFilter: 'blur(10px)' } as any, default: {} })]}>
              <View style={styles.featureIcon}>
                <Utensils size={24} color={Colors.light.tint} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Share Reviews</Text>
                <Text style={styles.featureDescription}>Help others discover great food experiences</Text>
              </View>
            </View>
            
            <View style={[styles.feature, Platform.select({ web: { backdropFilter: 'blur(10px)' } as any, default: {} })]}>
              <View style={styles.featureIcon}>
                <Heart size={24} color={Colors.light.tint} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Save Favorites</Text>
                <Text style={styles.featureDescription}>Keep track of your must-visit places</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              testID="welcome-signup"
              style={styles.primaryButton} 
              onPress={navigateToSignup}
            >
              <LinearGradient 
                colors={['#FF6B35', '#F7931E']} 
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <ArrowRight size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              testID="welcome-login"
              style={styles.secondaryButton} 
              onPress={navigateToLogin}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        </ScrollView>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  iconWrapper: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrapperSecondary: {
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 20,
  },
  iconWrapperTertiary: {
    bottom: -5,
    left: -15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 18,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  featuresSection: {
    width: '100%',
    gap: 20,
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  actionSection: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 80,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 300,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});