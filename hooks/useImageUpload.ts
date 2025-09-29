import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { pickAndUploadImage, takePhotoAndUpload, uploadImageAsync, type StorageBucket, type UploadResult } from '@/utils/supabaseUpload';

interface UseImageUploadOptions {
  bucket: StorageBucket;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface UploadOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export function useImageUpload({ bucket, onSuccess, onError }: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const showError = (message: string) => {
    if (Platform.OS === 'web') {
      console.error('[Upload Error]:', message);
    } else {
      Alert.alert('Upload Error', message);
    }
  };

  const pickImage = async (options?: UploadOptions): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      
      const result = await pickAndUploadImage(bucket, options);
      
      if (result) {
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to pick and upload image');
      console.error('[useImageUpload] pickImage error:', errorObj.message);
      onError?.(errorObj);
      showError(errorObj.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async (options?: UploadOptions): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      
      const result = await takePhotoAndUpload(bucket, options);
      
      if (result) {
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to take photo and upload');
      console.error('[useImageUpload] takePhoto error:', errorObj.message);
      onError?.(errorObj);
      showError(errorObj.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFromUri = async (uri: string): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      
      const result = await uploadImageAsync(uri, bucket);
      
      if (result) {
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to upload image from URI');
      console.error('[useImageUpload] uploadFromUri error:', errorObj.message);
      onError?.(errorObj);
      showError(errorObj.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    pickImage,
    takePhoto,
    uploadFromUri,
  };
}