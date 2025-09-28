import { QueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useSettings } from "@/providers/SettingsProvider";
import { AppProviders } from "@/providers/AppProviders";
import Colors from "@/constants/colors";
import { APP_CONFIG } from "@/constants/app-config";
import CustomSplashScreen from "@/components/SplashScreen";
import { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

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
  const { colors } = useSettings();
  
  const screenOptions = useMemo(() => ({
    headerBackTitle: "Back",
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' as const },
    animation: 'slide_from_right' as const,
  }), [colors]);
  
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
    </Stack>
  );
}

function RootLayoutNav() {
  return <ThemedStack />;
}

function MobileBlockedScreen() {
  return (
    <View style={[styles.container, styles.blocked]} testID="web-blocked">
      <View style={styles.blockedCard}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.blockedTitle}>📱 Mobile Experience</Text>
        <Text style={styles.blockedSubtitle}>
          {APP_CONFIG.name} is optimized for mobile devices. Scan the QR code to open in Expo Go on your phone.
        </Text>
        <Text style={styles.blockedHint}>
          For the best experience, use your mobile device.
        </Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showCustomSplash, setShowCustomSplash] = useState<boolean>(true);

  useEffect(() => {
    console.info('[Config]', { API_URL, SUPABASE_URL: Boolean(SUPABASE_URL), anonKey: Boolean(SUPABASE_ANON_KEY) });
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
  blocked: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
  },
  blockedCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 12,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  blockedSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  blockedHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});
