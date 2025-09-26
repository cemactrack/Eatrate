import { Platform } from 'react-native';
import { Image } from 'expo-image';

// Image optimization utilities for better performance

export interface OptimizedImageProps {
  uri: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  placeholder?: string;
  priority?: boolean;
}

export interface ImageCacheConfig {
  maxSize: number; // in MB
  maxAge: number; // in milliseconds
  compressionQuality: number;
}

const DEFAULT_CACHE_CONFIG: ImageCacheConfig = {
  maxSize: 100, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compressionQuality: 0.8,
};

/**
 * Generates optimized image URL with proper sizing and format
 */
export function getOptimizedImageUrl({
  uri,
  width,
  height,
  quality = 80,
  format = 'webp',
}: OptimizedImageProps): string {
  if (!uri) return '';
  
  // For local images, return as-is
  if (uri.startsWith('file://') || uri.startsWith('data:')) {
    return uri;
  }

  // For external URLs, apply optimizations
  const url = new URL(uri);
  
  // Add optimization parameters
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  url.searchParams.set('q', quality.toString());
  
  // Use WebP on supported platforms
  if (Platform.OS === 'web' || Platform.OS === 'android') {
    url.searchParams.set('f', format);
  }
  
  return url.toString();
}

/**
 * Generates blur placeholder for progressive loading
 */
export function generateBlurPlaceholder(uri: string): string {
  if (!uri) return '';
  
  // Generate a low-quality placeholder
  return getOptimizedImageUrl({
    uri,
    width: 20,
    height: 20,
    quality: 10,
    format: 'jpeg',
  });
}

/**
 * Preloads images based on priority and viewport
 */
export class ImagePreloader {
  private static instance: ImagePreloader;
  private preloadQueue: Set<string> = new Set();
  private preloadedImages: Map<string, boolean> = new Map();
  private maxConcurrentPreloads = 3;
  private currentPreloads = 0;

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  /**
   * Adds image to preload queue
   */
  preload(uri: string, priority: boolean = false): void {
    if (!uri || this.preloadedImages.has(uri)) return;

    if (priority) {
      // Add to front of queue for high priority images
      const queueArray = Array.from(this.preloadQueue);
      this.preloadQueue.clear();
      this.preloadQueue.add(uri);
      queueArray.forEach(url => this.preloadQueue.add(url));
    } else {
      this.preloadQueue.add(uri);
    }

    this.processQueue();
  }

  /**
   * Preloads multiple images
   */
  preloadBatch(uris: string[], priority: boolean = false): void {
    uris.forEach(uri => this.preload(uri, priority));
  }

  private async processQueue(): Promise<void> {
    if (this.currentPreloads >= this.maxConcurrentPreloads || this.preloadQueue.size === 0) {
      return;
    }

    const uri = this.preloadQueue.values().next().value;
    this.preloadQueue.delete(uri);
    this.currentPreloads++;

    try {
      await this.preloadImage(uri);
      this.preloadedImages.set(uri, true);
    } catch (error) {
      console.warn('Failed to preload image:', uri, error);
    } finally {
      this.currentPreloads--;
      this.processQueue(); // Process next in queue
    }
  }

  private preloadImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = uri;
      } else {
        // Use Expo Image prefetch for native platforms
        Image.prefetch(uri)
          .then(() => resolve())
          .catch(reject);
      }
    });
  }

  /**
   * Clears preload cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadQueue.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { preloaded: number; queued: number } {
    return {
      preloaded: this.preloadedImages.size,
      queued: this.preloadQueue.size,
    };
  }
}

/**
 * Hook for intelligent image preloading based on scroll position
 */
export function useImagePreloading() {
  const preloader = ImagePreloader.getInstance();

  const preloadImagesInViewport = (images: OptimizedImageProps[], scrollY: number, viewportHeight: number) => {
    const preloadDistance = viewportHeight * 2; // Preload 2 screens ahead
    
    images.forEach((image, index) => {
      const estimatedPosition = index * 200; // Estimate 200px per item
      const distanceFromViewport = Math.abs(estimatedPosition - scrollY);
      
      if (distanceFromViewport <= preloadDistance) {
        const optimizedUri = getOptimizedImageUrl(image);
        preloader.preload(optimizedUri, distanceFromViewport <= viewportHeight);
      }
    });
  };

  return {
    preloadImagesInViewport,
    preloadImage: (uri: string, priority?: boolean) => preloader.preload(uri, priority),
    preloadBatch: (uris: string[], priority?: boolean) => preloader.preloadBatch(uris, priority),
    getCacheStats: () => preloader.getCacheStats(),
    clearCache: () => preloader.clearCache(),
  };
}

/**
 * Image format detection and fallback
 */
export function getImageWithFallback(uri: string): { primary: string; fallback: string } {
  const webpUri = getOptimizedImageUrl({ uri, format: 'webp' });
  const jpegUri = getOptimizedImageUrl({ uri, format: 'jpeg' });
  
  return {
    primary: Platform.select({
      web: webpUri,
      android: webpUri,
      default: jpegUri,
    }),
    fallback: jpegUri,
  };
}

/**
 * Responsive image sizing based on device
 */
export function getResponsiveImageSize(baseWidth: number, baseHeight: number) {
  const devicePixelRatio = Platform.select({
    web: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    default: 2, // Assume 2x for mobile devices
  });

  return {
    width: Math.round(baseWidth * devicePixelRatio),
    height: Math.round(baseHeight * devicePixelRatio),
    displayWidth: baseWidth,
    displayHeight: baseHeight,
  };
}

export default {
  getOptimizedImageUrl,
  generateBlurPlaceholder,
  ImagePreloader,
  useImagePreloading,
  getImageWithFallback,
  getResponsiveImageSize,
};