import { Tabs, useRouter } from "expo-router";
import { Home, Search, User, Truck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function TabsLayout() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const router = useRouter();

  // Ensure component is mounted before accessing auth context
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always call hooks in the same order
  const authContext = useAuth();

  useEffect(() => {
    if (!isMounted || !authContext) {
      return;
    }
    
    const { user, isLoading } = authContext;
    
    if (!isLoading && !user) {
      try {
        router.replace('/login' as const);
      } catch (e) {
        console.log('[Tabs/_layout] redirect error', e);
      }
    }
  }, [isMounted, authContext, router]);

  if (!isMounted) {
    return (
      <View style={styles.loadingContainer} testID="tabs-mounting">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!authContext) {
    return (
      <View style={styles.loadingContainer} testID="tabs-no-auth-context">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const { user, isLoading } = authContext;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID="tabs-auth-loading">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer} testID="tabs-no-user">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        lazy: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(suppliers)"
        options={{
          title: "Suppliers",
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});

