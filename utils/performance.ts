import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Platform, InteractionManager } from 'react-native';

/**
 * Performance optimization utilities for React Native components
 */

// Memoization helper with custom comparison
export function createMemoComponent<T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
  return memo(Component, areEqual) as T;
}

// Optimized list item component factory
export function createOptimizedListItem<T>(
  renderItem: (item: T, index: number) => React.ReactElement,
  keyExtractor: (item: T, index: number) => string,
  areEqual?: (prevProps: { item: T; index: number }, nextProps: { item: T; index: number }) => boolean
) {
  const ListItem = memo<{ item: T; index: number }>(({ item, index }) => {
    return renderItem(item, index);
  }, areEqual);

  return {
    ListItem,
    keyExtractor,
  };
}

// Debounced callback hook
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const debouncedCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    }) as T;
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

// Stable callback hook (prevents unnecessary re-renders)
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Platform-specific optimization
export function usePlatformOptimization() {
  return useMemo(() => ({
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
    shouldUseNativeDriver: Platform.OS !== 'web',
    shouldUseVirtualization: Platform.OS !== 'web',
    maxConcurrentRequests: Platform.OS === 'web' ? 6 : 4,
  }), []);
}

// Interaction manager hook for heavy operations
export function useInteractionManager(callback: () => void, deps: React.DependencyList) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => task.cancel();
  }, deps);
}

// Throttled callback hook
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
}

// Memory-efficient state hook for large objects
export function useOptimizedState<T>(initialState: T) {
  const [state, setState] = React.useState<T>(initialState);
  
  const updateState = useCallback((updates: Partial<T>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);
  
  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);
  
  return [state, updateState, resetState] as const;
}

// Lazy component loader
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFn);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    if (__DEV__) {
      console.log(`[Performance] ${componentName} - Render #${renderCount.current} took ${renderTime}ms`);
    }
    
    startTime.current = Date.now();
  });
  
  return {
    renderCount: renderCount.current,
  };
}