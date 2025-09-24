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
import { SettingsProvider } from "@/providers/SettingsProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import Colors from "@/constants/colors";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 15, // 15 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="restaurants" options={{ 
        headerShown: true, 
        title: "Restaurants",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
      <Stack.Screen name="comments/[postId]" options={{ 
        presentation: "modal", 
        title: "Comments",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text
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
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
      <Stack.Screen name="profile/edit" options={{ 
        title: "Edit Profile", 
        presentation: "modal",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' }
      }} />
      <Stack.Screen name="status" options={{ 
        title: "Post Status", 
        presentation: "modal",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' }
      }} />
      <Stack.Screen name="admin" options={{ 
        headerShown: false,
        gestureEnabled: false
      }} />
      <Stack.Screen name="users/[id]" options={{ 
        title: "User Profile",
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: "Back"
      }} />
    </Stack>
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

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <StorageProvider>
                <AuthProvider>
                  <AdminProvider>
                    <SettingsProvider>
                      <RootLayoutNav />
                    </SettingsProvider>
                  </AdminProvider>
                </AuthProvider>
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
