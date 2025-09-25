import { Tabs, useRouter } from "expo-router";
import { Home, Search, User, Truck } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function TabsLayout() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const isLoading = auth?.isLoading ?? true;
  const redirectedRef = useRef<boolean>(false);

  const screenOptions = useMemo(
    () => ({
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
    }),
    []
  );

  useEffect(() => {
    if (!isLoading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      try {
        router.replace('/login' as const);
      } catch (e) {
        console.log('[Tabs/_layout] redirect error', e);
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID="tabs-auth-loading">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!user) {
    return <View style={styles.loadingContainer} testID="tabs-no-user" />;
  }

  return (
    <View style={styles.tabsRoot} testID="main-tabs">
      <Tabs screenOptions={screenOptions}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  tabsRoot: {
    flex: 1,
  },
});

