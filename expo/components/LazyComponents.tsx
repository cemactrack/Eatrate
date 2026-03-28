import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createLazyComponent } from '@/utils/performance';
import Colors from '@/constants/colors';

// Loading fallback component
const LazyLoadingFallback: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <View style={[styles.loadingContainer, { height }]}>
    <ActivityIndicator size="large" color={Colors.light.tint} />
  </View>
);

// Lazy load heavy components
export const LazyPostComposer = createLazyComponent(
  () => import('@/components/PostComposer')
);

export const LazyAdminPanel = createLazyComponent(
  () => import('@/app/admin/index')
);

// Note: These components will be created as needed
// export const LazyMessagingInterface = createLazyComponent(
//   () => import('@/components/MessagingInterface')
// );

// export const LazyAIScanner = createLazyComponent(
//   () => import('@/components/AIScanner')
// );

// export const LazyAnalyticsDashboard = createLazyComponent(
//   () => import('@/components/AnalyticsDashboard')
// );

// Wrapper component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallbackHeight?: number;
  errorFallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallbackHeight = 200,
  errorFallback 
}) => (
  <Suspense 
    fallback={<LazyLoadingFallback height={fallbackHeight} />}
  >
    {children}
  </Suspense>
);

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});