import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";
import { StorageProvider } from "@/providers/StorageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SettingsProvider, useSettings } from "@/providers/SettingsProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import Colors from "@/constants/colors";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Reduced from 1 to 0 for faster failure detection
      staleTime: 1000 * 60 * 30, // Increased from 15 to 30 minutes for better caching
      gcTime: 1000 * 60 * 45, // Increased from 30 to 45 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: 'online',
      refetchOnMount: false,
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

function ThemedStack() {
  const { colors } = useSettings();
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="restaurants" options={{ 
        headerShown: true, 
        title: "Restaurants",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
      <Stack.Screen name="comments/[postId]" options={{ 
        presentation: "modal", 
        title: "Comments",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text
      }} />
      <Stack.Screen name="welcome" options={{ 
        headerShown: false,
        gestureEnabled: false
      }} />
      <Stack.Screen name="login" options={{ 
        headerShown: false,
        gestureEnabled: false
      }} />
      <Stack.Screen name="signup" options={{ 
        headerShown: false,
        gestureEnabled: false
      }} />
      <Stack.Screen name="settings" options={{ 
        title: "Settings",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
      <Stack.Screen name="profile/edit" options={{ 
        title: "Edit Profile", 
        presentation: "modal",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' }
      }} />
      <Stack.Screen name="status" options={{ 
        title: "Post Status", 
        presentation: "modal",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' }
      }} />
      <Stack.Screen name="admin" options={{ 
        headerShown: false,
        gestureEnabled: false
      }} />
      <Stack.Screen name="users/[id]" options={{ 
        title: "User Profile",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
      <Stack.Screen name="posts/feed" options={{ 
        title: "Feed",
        headerShown: false
      }} />
      <Stack.Screen name="posts/[postId]" options={{ 
        title: "Post",
        headerShown: false
      }} />
    </Stack>
  );
}

function RootLayoutNav() {
  return <ThemedStack />;
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
});
