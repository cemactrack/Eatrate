export const APP_CONFIG = {
  name: 'EatRate',
  version: '1.0.0',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 45000,
    retryAttempts: 2,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 45 * 60 * 1000, // 45 minutes
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  features: {
    enablePerformanceMonitoring: __DEV__,
    enableAnalytics: !__DEV__,
    enablePushNotifications: true,
    enableLocationServices: true,
  },
  ui: {
    animationDuration: 300,
    debounceDelay: 500,
    loadMoreThreshold: 0.8,
  },
  limits: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxVideoSize: 50 * 1024 * 1024, // 50MB
    maxPostLength: 2000,
    maxImagesPerPost: 10,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  cache: {
    userProfile: 1000 * 60 * 30, // 30 minutes
    restaurants: 1000 * 60 * 15, // 15 minutes
    posts: 1000 * 60 * 5, // 5 minutes
    dishes: 1000 * 60 * 20, // 20 minutes
  },
} as const;

export const CITIES = {
  DOUALA: 'douala',
  YAOUNDE: 'yaounde',
  BUEA: 'buea',
  LIMBE: 'limbe',
} as const;

export const POST_TYPES = {
  REVIEW: 'review',
  PHOTO: 'photo',
  VIDEO: 'video',
  STORY: 'story',
} as const;

export const USER_ROLES = {
  USER: 'user',
  RESTAURANT_OWNER: 'restaurant_owner',
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
} as const;