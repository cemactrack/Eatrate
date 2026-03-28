import { Platform } from 'react-native';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const validateImageFile = (
  mimeType: string,
  fileSize: number,
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): ImageValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }
  
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`,
    };
  }
  
  return { isValid: true };
};

export const generateImageFileName = (
  category: string,
  originalName?: string,
  extension?: string
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const ext = extension || originalName?.split('.').pop() || 'jpg';
  
  return `${category}_${timestamp}_${randomId}.${ext}`;
};

export const getImageStoragePath = (
  userId: string,
  category: 'avatar' | 'restaurant-photo' | 'post-media',
  fileName: string
): string => {
  const categoryPaths = {
    'avatar': 'avatars',
    'restaurant-photo': 'restaurant-photos',
    'post-media': 'post-media',
  };
  
  return `${categoryPaths[category]}/${userId}/${fileName}`;
};

export const optimizeImageForUpload = (
  base64Data: string,
  options: ImageOptimizationOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      // Web-specific image optimization
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data URL prefix
        const base64Only = optimizedBase64.split(',')[1];
        resolve(base64Only);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = `data:image/jpeg;base64,${base64Data}`;
    } else {
      // On mobile, return original data (optimization handled by expo-image-picker)
      resolve(base64Data);
    }
  });
};

export const getImageDimensions = (base64Data: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to get image dimensions'));
      img.src = `data:image/jpeg;base64,${base64Data}`;
    } else {
      // On mobile, we can't easily get dimensions from base64
      // This would require additional native modules
      resolve({ width: 0, height: 0 });
    }
  });
};

export const createImageThumbnail = (
  base64Data: string,
  size: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop dimensions for square thumbnail
        const { width, height } = img;
        const cropSize = Math.min(width, height);
        const cropX = (width - cropSize) / 2;
        const cropY = (height - cropSize) / 2;
        
        ctx?.drawImage(
          img,
          cropX, cropY, cropSize, cropSize,
          0, 0, size, size
        );
        
        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);
        const base64Only = thumbnailBase64.split(',')[1];
        resolve(base64Only);
      };
      
      img.onerror = () => reject(new Error('Failed to create thumbnail'));
      img.src = `data:image/jpeg;base64,${base64Data}`;
    } else {
      // On mobile, return original (thumbnail creation would need native modules)
      resolve(base64Data);
    }
  });
};

export const formatFileSize = (bytes: number): string => {
  if (typeof bytes !== 'number' || bytes < 0 || !isFinite(bytes)) {
    return '0 Bytes';
  }
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  if (imageExtensions.test(url)) return true;
  
  // Check for data URLs
  if (url.startsWith('data:image/')) return true;
  
  // Check for common image hosting patterns
  const imageHostPatterns = [
    /unsplash\.com/,
    /imgur\.com/,
    /cloudinary\.com/,
    /supabase\.co.*\/storage\//,
  ];
  
  return imageHostPatterns.some(pattern => pattern.test(url));
};