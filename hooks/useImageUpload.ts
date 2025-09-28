import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';

export type ImageUploadCategory = 'avatar' | 'restaurant-photo' | 'post-media';

export interface ImageUploadOptions {
  category: ImageUploadCategory;
  metadata?: {
    restaurantId?: string;
    postId?: string;
  };
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  error?: string;
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImageMutation = trpc.uploads.uploadImage.useMutation();
  const deleteImageMutation = trpc.uploads.deleteImage.useMutation();

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }
    }
    return true;
  };

  const pickImage = async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Camera roll permissions are required to upload images.',
        };
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return {
          success: false,
          error: 'Image selection was cancelled.',
        };
      }

      const asset = result.assets[0];
      
      if (!asset.base64) {
        return {
          success: false,
          error: 'Failed to process image data.',
        };
      }

      setUploadProgress(50);

      // Upload to server
      const uploadResult = await uploadImageMutation.mutateAsync({
        file: {
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        },
        category: options.category,
        metadata: options.metadata,
      });

      setUploadProgress(100);

      return {
        success: true,
        url: uploadResult.url,
        path: uploadResult.path,
        fileName: uploadResult.fileName,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const takePhoto = async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Request camera permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          return {
            success: false,
            error: 'Camera permissions are required to take photos.',
          };
        }
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return {
          success: false,
          error: 'Photo capture was cancelled.',
        };
      }

      const asset = result.assets[0];
      
      if (!asset.base64) {
        return {
          success: false,
          error: 'Failed to process photo data.',
        };
      }

      setUploadProgress(50);

      // Upload to server
      const uploadResult = await uploadImageMutation.mutateAsync({
        file: {
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        },
        category: options.category,
        metadata: options.metadata,
      });

      setUploadProgress(100);

      return {
        success: true,
        url: uploadResult.url,
        path: uploadResult.path,
        fileName: uploadResult.fileName,
      };
    } catch (error) {
      console.error('Photo capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture photo',
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteImageMutation.mutateAsync({ path });
      return { success: true };
    } catch (error) {
      console.error('Image delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  };

  return {
    pickImage,
    takePhoto,
    deleteImage,
    isUploading,
    uploadProgress,
    isDeleting: deleteImageMutation.isLoading,
  };
};