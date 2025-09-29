/**
 * Deployment utilities for production readiness
 * Handles environment configuration, health checks, and deployment validation
 */

import { Platform } from 'react-native';
import { getApiBase } from '@/lib/config';

// Environment configuration
export const ENV_CONFIG = {
  development: {
    apiUrl: getApiBase(),
    enableDebug: true,
    enablePerformanceMonitoring: true,
    logLevel: 'debug' as const,
  },
  staging: {
    apiUrl: getApiBase(),
    enableDebug: false,
    enablePerformanceMonitoring: true,
    logLevel: 'info' as const,
  },
  production: {
    apiUrl: getApiBase(),
    enableDebug: false,
    enablePerformanceMonitoring: true,
    logLevel: 'error' as const,
  },
};

// Get current environment
export const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return env as keyof typeof ENV_CONFIG;
};

// Get environment configuration
export const getEnvConfig = () => {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env];
};

// Health check utilities
export const healthCheck = {
  // Check API connectivity
  async checkAPI(): Promise<boolean> {
    try {
      const config = getEnvConfig();
      const response = await fetch(`${config.apiUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  },

  // Check local storage
  async checkStorage(): Promise<boolean> {
    try {
      // For web, use localStorage; for native, this would use the storage provider
      if (Platform.OS === 'web') {
        const testKey = '__health_check__';
        const testValue = 'test';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return retrieved === testValue;
      }
      // For native platforms, assume storage is available
      // In real implementation, use storage provider
      return true;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  },

  // Check device capabilities
  checkDevice(): boolean {
    try {
      // Check platform support
      const supportedPlatforms = ['ios', 'android', 'web'];
      if (!supportedPlatforms.includes(Platform.OS)) {
        return false;
      }

      // Check memory (basic check)
      if (Platform.OS === 'web') {
        // @ts-ignore - navigator.deviceMemory is experimental
        const deviceMemory = navigator.deviceMemory;
        if (deviceMemory && deviceMemory < 2) {
          console.warn('Low device memory detected');
        }
      }

      return true;
    } catch (error) {
      console.error('Device health check failed:', error);
      return false;
    }
  },

  // Run all health checks
  async runAll(): Promise<{
    api: boolean;
    storage: boolean;
    device: boolean;
    overall: boolean;
  }> {
    const [api, storage] = await Promise.all([
      this.checkAPI(),
      this.checkStorage(),
    ]);
    const device = this.checkDevice();
    
    const overall = api && storage && device;
    
    return { api, storage, device, overall };
  },
};

// Performance monitoring
export const performanceMonitor = {
  // Track app startup time
  startupTime: Date.now(),
  
  // Get startup duration
  getStartupDuration(): number {
    return Date.now() - this.startupTime;
  },

  // Track screen navigation
  trackNavigation(screenName: string, startTime: number) {
    const duration = Date.now() - startTime;
    console.log(`Navigation to ${screenName}: ${duration}ms`);
    
    // In production, send to analytics service
    if (getCurrentEnvironment() === 'production') {
      // Analytics.track('screen_navigation', {
      //   screen: screenName,
      //   duration,
      // });
    }
  },

  // Track component render time
  trackRender(componentName: string, renderTime: number) {
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
    
    // In production, send to performance monitoring service
    if (getCurrentEnvironment() === 'production' && renderTime > 100) {
      // PerformanceMonitoring.track('slow_render', {
      //   component: componentName,
      //   duration: renderTime,
      // });
    }
  },

  // Memory usage tracking
  trackMemoryUsage() {
    if (Platform.OS === 'web' && 'memory' in performance) {
      // @ts-ignore - performance.memory is non-standard
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      
      console.log(`Memory usage: ${usedMB}MB / ${totalMB}MB`);
      
      // Alert if memory usage is high
      if (usedMB > 100) {
        console.warn('High memory usage detected');
      }
    }
  },
};

// Deployment validation
export const deploymentValidator = {
  // Validate environment variables
  validateEnvironment(): boolean {
    const requiredVars = [
      'EXPO_PUBLIC_API_URL',
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }
    
    return true;
  },

  // Validate app configuration
  validateConfiguration(): boolean {
    try {
      const config = getEnvConfig();
      
      // Validate API URL format
      new URL(config.apiUrl);
      
      // Validate log level
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      if (!validLogLevels.includes(config.logLevel)) {
        console.error('Invalid log level:', config.logLevel);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  },

  // Run all validations
  async validateDeployment(): Promise<boolean> {
    console.log('Running deployment validation...');
    
    const environmentValid = this.validateEnvironment();
    const configurationValid = this.validateConfiguration();
    const healthChecks = await healthCheck.runAll();
    
    const isValid = environmentValid && configurationValid && healthChecks.overall;
    
    if (isValid) {
      console.log('✅ Deployment validation passed');
    } else {
      console.error('❌ Deployment validation failed');
      console.error('Environment:', environmentValid);
      console.error('Configuration:', configurationValid);
      console.error('Health checks:', healthChecks);
    }
    
    return isValid;
  },
};

// Error reporting utilities
export const errorReporter = {
  // Report error to monitoring service
  reportError(error: Error, context?: Record<string, any>) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      environment: getCurrentEnvironment(),
      context,
    };
    
    console.error('Error reported:', errorInfo);
    
    // In production, send to error monitoring service
    if (getCurrentEnvironment() === 'production') {
      // ErrorMonitoring.captureException(error, errorInfo);
    }
  },

  // Report performance issue
  reportPerformanceIssue(issue: {
    type: string;
    description: string;
    metrics?: Record<string, number>;
  }) {
    const performanceInfo = {
      ...issue,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      environment: getCurrentEnvironment(),
    };
    
    console.warn('Performance issue reported:', performanceInfo);
    
    // In production, send to performance monitoring service
    if (getCurrentEnvironment() === 'production') {
      // PerformanceMonitoring.track('performance_issue', performanceInfo);
    }
  },
};

// Feature flags for gradual rollout
export const featureFlags = {
  // Check if feature is enabled
  isEnabled(featureName: string): boolean {
    const env = getCurrentEnvironment();
    
    // Feature flag configuration
    const flags: Record<string, Record<string, boolean>> = {
      development: {
        newUI: true,
        advancedSearch: true,
        aiFeatures: true,
        socialFeatures: true,
      },
      staging: {
        newUI: true,
        advancedSearch: true,
        aiFeatures: false,
        socialFeatures: true,
      },
      production: {
        newUI: false,
        advancedSearch: true,
        aiFeatures: false,
        socialFeatures: true,
      },
    };
    
    return flags[env]?.[featureName] ?? false;
  },

  // Get all enabled features
  getEnabledFeatures(): string[] {
    const env = getCurrentEnvironment();
    const flags = {
      development: ['newUI', 'advancedSearch', 'aiFeatures', 'socialFeatures'],
      staging: ['newUI', 'advancedSearch', 'socialFeatures'],
      production: ['advancedSearch', 'socialFeatures'],
    };
    
    return flags[env] || [];
  },
};