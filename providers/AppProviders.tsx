import React, { useMemo, Suspense, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';

import { trpc, trpcClient } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';
import { StorageProvider } from '@/providers/StorageProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { LocalizationProvider } from '@/providers/LocalizationProvider';
import { AdminProvider } from '@/providers/AdminProvider';
import { GamificationProvider } from '@/providers/GamificationProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { PushNotificationProvider, usePushNotifications } from '@/providers/PushNotificationProvider';
import ForegroundNotificationHost from '@/components/ForegroundNotificationHost';
import { MessagingProvider } from '@/providers/MessagingProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ErrorProvider } from '@/providers/ErrorProvider';

import Colors from '@/constants/colors';

const LoadingFallback: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.light.tint} />
  </View>
);

const PushNotificationToastHost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ToastComponent } = usePushNotifications();
  
  return (
    <>
      {children}
      {ToastComponent}
    </>
  );
};

interface CoreProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

const CoreProviders: React.FC<CoreProvidersProps> = ({ children, queryClient }) => {
  // Memoize the tRPC client to prevent unnecessary re-renders
  const memoizedTrpcClient = useMemo(() => trpcClient, []);
  
  // Handle React Native Web rehydration safely
  const [isHydrated, setIsHydrated] = useState<boolean>(() => {
    // On web, we need to wait for hydration to prevent SSR mismatches
    return Platform.OS !== 'web';
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Ensure client-side hydration is complete
      setIsHydrated(true);
    }
  }, []);

  if (!isHydrated) {
    return <LoadingFallback />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={memoizedTrpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <StorageProvider>
                <LocalizationProvider>
                  <ThemeProvider>
                    <SettingsProvider>
                      <ErrorProvider>
                        <AuthProvider>
                          <PushNotificationProvider>
                            <PushNotificationToastHost>
                              {children}
                            </PushNotificationToastHost>
                          </PushNotificationProvider>
                        </AuthProvider>
                      </ErrorProvider>
                    </SettingsProvider>
                  </ThemeProvider>
                </LocalizationProvider>
              </StorageProvider>
            </ErrorBoundary>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </trpc.Provider>
    </QueryClientProvider>
  );
};

interface FeatureProvidersProps {
  children: React.ReactNode;
}

const FeatureProviders: React.FC<FeatureProvidersProps> = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    <ErrorBoundary>
      <NotificationProvider>
        <ForegroundNotificationHost />
        <GamificationProvider>
          <MessagingProvider>
            <AdminProvider>
              {children}
            </AdminProvider>
          </MessagingProvider>
        </GamificationProvider>
      </NotificationProvider>
    </ErrorBoundary>
  </Suspense>
);

interface AppProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
  enableFeatures?: boolean;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ 
  children, 
  queryClient, 
  enableFeatures = true 
}) => {
  const providers = useMemo(() => {
    if (enableFeatures) {
      return (
        <CoreProviders queryClient={queryClient}>
          <FeatureProviders>
            {children}
          </FeatureProviders>
        </CoreProviders>
      );
    }

    return (
      <CoreProviders queryClient={queryClient}>
        {children}
      </CoreProviders>
    );
  }, [children, queryClient, enableFeatures]);

  return providers;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});