import { QueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform, StyleSheet, View, ActivityIndicator, StatusBar } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { AppProviders } from "@/providers/AppProviders";
import Colors from "@/constants/colors";
import { APP_CONFIG } from "@/constants/app-config";
import CustomSplashScreen from "@/components/SplashScreen";
import { getEnv } from "@/lib/env";
import NotificationToast from "@/components/NotificationToast";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { tokens } from '@/src/theme';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

// Optimized query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: APP_CONFIG.api.retryAttempts,
      staleTime: APP_CONFIG.api.staleTime,
      gcTime: APP_CONFIG.api.cacheTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function ThemedStack() {
  const screenOptions = useMemo(() => ({
    headerBackTitle: "Back",
    headerStyle: {
      height: 56,
      backgroundColor: tokens.colors.bg,
    },
    headerTitleStyle: {
      fontFamily: 'Inter',
      fontSize: tokens.font.size.lg,
      fontWeight: '700' as const,
    },
    headerShadowVisible: false,
    animation: 'slide_from_right' as const,
  }), []);
  
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="restaurants" 
        options={{ 
          headerShown: true, 
          title: "Restaurants",
        }} 
      />
      <Stack.Screen 
        name="comments/[postId]" 
        options={{ 
          presentation: "modal", 
          title: "Comments",
        }} 
      />
      <Stack.Screen 
        name="welcome" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="auth/login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="auth/signup" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: "Settings",
        }} 
      />
      <Stack.Screen 
        name="profile/edit" 
        options={{ 
          title: "Edit Profile", 
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="status" 
        options={{ 
          title: "Post Status", 
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="admin" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="users/[id]" 
        options={{ 
          title: "User Profile",
        }} 
      />
      <Stack.Screen 
        name="posts/feed" 
        options={{ 
          title: "Feed",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="posts/[postId]" 
        options={{ 
          title: "Post",
          headerShown: false,
        }} 
      />

      <Stack.Screen 
        name="bookmarks" 
        options={{ 
          title: "Bookmarks",
        }} 
      />
      <Stack.Screen 
        name="achievements" 
        options={{ 
          title: "Achievements",
        }} 
      />
      <Stack.Screen 
        name="events" 
        options={{ 
          title: "Events & Challenges",
        }} 
      />
      <Stack.Screen 
        name="reservations" 
        options={{ 
          title: "Reservations",
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: "Notifications",
        }} 
      />
      <Stack.Screen 
        name="premium" 
        options={{ 
          title: "Premium Subscription",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="groups" 
        options={{ 
          title: "Foodie Groups",
        }} 
      />
      <Stack.Screen 
        name="trending" 
        options={{ 
          title: "Trending Dishes",
        }} 
      />
      <Stack.Screen 
        name="reputation" 
        options={{ 
          title: "Reputation & Badges",
        }} 
      />
      <Stack.Screen 
        name="messages" 
        options={{ 
          title: "Messages",
        }} 
      />
      <Stack.Screen 
        name="push-notification-demo" 
        options={{ 
          title: "Push Notifications",
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications-demo" 
        options={{ 
          title: "Notifications Demo",
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="trpc-demo" 
        options={{ 
          title: "tRPC Demo",
          headerShown: true,
        }} 
      />
    </Stack>
  );
}

function RootLayoutNav() {
  return <ThemedStack />;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showCustomSplash, setShowCustomSplash] = useState<boolean>(true);
  const [missingEnvVisible, setMissingEnvVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const env = getEnv(false);
      console.info("[Config]", { 
        API_URL: env.API_URL || 'NOT SET', 
        SUPABASE_URL: env.SUPABASE_URL || 'NOT SET', 
        HAS_ANON: Boolean(env.SUPABASE_ANON_KEY) 
      });
      
      if (!env.API_URL || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        console.warn('[Config] Some env vars are missing');
        setMissingEnvVisible(true);
      }
    } catch (error) {
      console.error('[Config] Failed to load env vars:', error);
      setMissingEnvVisible(true);
    }

    const prepare = async () => {
      try {
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsReady(true);
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  if (!isReady || showCustomSplash) {
    return (
      <>
        {!isReady && (
          <View style={[styles.container, styles.loading]}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        )}
        {isReady && showCustomSplash && (
          <CustomSplashScreen onFinish={handleSplashFinish} />
        )}
      </>
    );
  }

  // Allow web for development and testing
  // if (Platform.OS === 'web') {
  //   return <MobileBlockedScreen />;
  // }

  return (
    <AppProviders queryClient={queryClient} enableFeatures={true}>
      <RootLayoutNav />
      <NotificationToast
        type="error"
        title="Missing env vars — check Expo EXPO_PUBLIC_*"
        visible={missingEnvVisible}
        onDismiss={() => setMissingEnvVisible(false)}
        duration={5000}
        testID="missing-env-toast"
      />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
