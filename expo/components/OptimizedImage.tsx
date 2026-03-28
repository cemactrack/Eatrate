import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  getOptimizedImageUrl,
  generateBlurPlaceholder,
  getImageWithFallback,
  getResponsiveImageSize,
  useImagePreloading,
  type OptimizedImageProps,
} from '@/utils/image-optimization';

interface OptimizedImageComponentProps {
  uri: string;
  width: number;
  height: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  priority?: boolean;
  placeholder?: boolean;
  fallback?: boolean;
  style?: any;
  onLoad?: () => void;
  onError?: (error: any) => void;
  testID?: string;
}

/**
 * Optimized image component with progressive loading, format fallback, and preloading
 */
export const OptimizedImage = React.memo<OptimizedImageComponentProps>((
  {
    uri,
    width,
    height,
    quality = 80,
    format = 'webp',
    priority = false,
    placeholder = true,
    fallback = true,
    style,
    onLoad,
    onError,
    testID,
  }
) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentUri, setCurrentUri] = useState<string>('');
  
  const { preloadImage } = useImagePreloading();

  // Get responsive sizing
  const responsiveSize = getResponsiveImageSize(width, height);

  // Generate optimized URLs
  const optimizedUri = getOptimizedImageUrl({
    uri,
    width: responsiveSize.width,
    height: responsiveSize.height,
    quality,
    format,
  });

  const blurPlaceholder = placeholder ? generateBlurPlaceholder(uri) : '';
  const { primary: primaryUri, fallback: fallbackUri } = fallback 
    ? getImageWithFallback(uri) 
    : { primary: optimizedUri, fallback: optimizedUri };

  // Preload image if priority is set
  useEffect(() => {
    if (priority && uri) {
      preloadImage(primaryUri, true);
    }
  }, [priority, uri, primaryUri, preloadImage]);

  // Set initial URI
  useEffect(() => {
    setCurrentUri(primaryUri);
    setImageLoaded(false);
    setImageError(false);
  }, [primaryUri]);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    console.warn('Image load error:', error);
    setImageError(true);
    
    // Try fallback if available and not already using it
    if (fallback && currentUri !== fallbackUri) {
      console.log('Trying fallback image format');
      setCurrentUri(fallbackUri);
      setImageError(false);
      return;
    }
    
    onError?.(error);
  }, [fallback, currentUri, fallbackUri, onError]);

  const imageStyle = [
    {
      width: responsiveSize.displayWidth,
      height: responsiveSize.displayHeight,
    },
    style,
  ];

  return (
    <View style={[styles.container, imageStyle]} testID={testID}>
      {/* Blur placeholder */}
      {placeholder && blurPlaceholder && !imageLoaded && (
        <Image
          source={{ uri: blurPlaceholder }}
          style={[StyleSheet.absoluteFill, styles.placeholder]}
          contentFit="cover"
        />
      )}
      
      {/* Main image */}
      {currentUri && !imageError && (
        <Image
          source={{ uri: currentUri }}
          style={[imageStyle, { opacity: imageLoaded ? 1 : 0 }]}
          contentFit="cover"
          onLoad={handleLoad}
          onError={handleError}
          priority={priority ? 'high' : 'normal'}
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      
      {/* Error fallback */}
      {imageError && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    opacity: 0.6,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorPlaceholder: {
    width: '40%',
    height: '40%',
    backgroundColor: '#d0d0d0',
    borderRadius: 4,
  },
});

/**
 * Hook for batch image preloading
 */
export function useBatchImagePreloading() {
  const { preloadBatch } = useImagePreloading();

  const preloadImages = useCallback((images: OptimizedImageProps[], priority: boolean = false) => {
    const uris = images
      .filter(img => img.uri)
      .map(img => getOptimizedImageUrl(img));
    
    preloadBatch(uris, priority);
  }, [preloadBatch]);

  return { preloadImages };
}

/**
 * Progressive image component with multiple quality levels
 */
export const ProgressiveImage = React.memo<OptimizedImageComponentProps & {
  qualities?: number[];
}>(({ qualities = [20, 50, 80], ...props }) => {
  const [currentQuality, setCurrentQuality] = useState<number>(qualities[0]);
  const [qualityIndex, setQualityIndex] = useState<number>(0);

  const handleLoad = useCallback(() => {
    // Load next quality level
    if (qualityIndex < qualities.length - 1) {
      const nextIndex = qualityIndex + 1;
      setQualityIndex(nextIndex);
      setCurrentQuality(qualities[nextIndex]);
    } else {
      props.onLoad?.();
    }
  }, [qualityIndex, qualities, props]);

  return (
    <OptimizedImage
      {...props}
      quality={currentQuality}
      onLoad={handleLoad}
    />
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';

export default OptimizedImage;