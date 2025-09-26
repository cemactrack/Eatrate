import React, { useMemo, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { trpc } from '@/lib/trpc';
import { trpcClient as mockTrpcClient } from '@/lib/trpc-mock';
import ErrorBoundary from '@/components/ErrorBoundary';
import { StorageProvider } from '@/providers/StorageProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { LocalizationProvider } from '@/providers/LocalizationProvider';
import { AdminProvider } from '@/providers/AdminProvider';
import { GamificationProvider } from '@/providers/GamificationProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { MessagingProvider } from '@/providers/MessagingProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

import Colors from '@/constants/colors';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.light.tint} />
  </View>
);

// Core providers that are always needed
interface CoreProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

const CoreProviders: React.FC<CoreProvidersProps> = ({ children, queryClient }) => (
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={mockTrpcClient as any} queryClient={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <StorageProvider>
              <LocalizationProvider>
                <ThemeProvider>
                  <SettingsProvider>
                    <AuthProvider>
                      {children}
                    </AuthProvider>
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

// Feature providers that can be conditionally loaded
interface FeatureProvidersProps {
  children: React.ReactNode;
}

const FeatureProviders: React.FC<FeatureProvidersProps> = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    <NotificationProvider>
      <GamificationProvider>
        <MessagingProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </MessagingProvider>
      </GamificationProvider>
    </NotificationProvider>
  </Suspense>
);

// Main app providers composition
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