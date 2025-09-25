import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";
import { StorageProvider } from "@/providers/StorageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SettingsProvider, useSettings } from "@/providers/SettingsProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import Colors from "@/constants/colors";
import { APP_CONFIG } from "@/constants/app-config";

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

  useEffect(() => {
    const prepare = async () => {
      try {
        if (Platform.OS === 'web') {
          setIsReady(true);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        await SplashScreen.hideAsync();
        setIsReady(true);
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return <MobileBlockedScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <StorageProvider>
                <SettingsProvider>
                  <AuthProvider>
                    <AdminProvider>
                      <RootLayoutNav />
                    </AdminProvider>
                  </AuthProvider>
                </SettingsProvider>
              </StorageProvider>
            </ErrorBoundary>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </trpc.Provider>
    </QueryClientProvider>
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
