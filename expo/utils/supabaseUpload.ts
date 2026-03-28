import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export type StorageBucket = 'avatars' | 'post-media' | 'restaurant-photos';
export type UploadResult = { url: string; path: string };

const mimeFromExt = (ext: string): string => {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext.toLowerCase()] ?? 'image/jpeg';
};

const filenameFromUri = (uri: string): string => {
  try {
    const withoutQuery = uri.split('?')[0] ?? uri;
    const parts = withoutQuery.split('/');
    const last = parts[parts.length - 1] ?? `image_${Date.now()}.jpg`;
    return last || `image_${Date.now()}.jpg`;
  } catch {
    return `image_${Date.now()}.jpg`;
  }
};

const showToast = (message: string, isError = false) => {
  if (Platform.OS === 'web') {
    console.log(`[Upload ${isError ? 'Error' : 'Success'}]:`, message);
  } else {
    Alert.alert(isError ? 'Upload Error' : 'Upload Success', message);
  }
};

/**
 * Uploads an image file to Supabase Storage
 * @param fileUri - Local file URI from expo-image-picker or camera
 * @param bucket - Storage bucket: 'avatars', 'post-media', or 'restaurant-photos'
 * @returns Promise with public URL and storage path
 */
export async function uploadImageAsync(
  fileUri: string, 
  bucket: StorageBucket
): Promise<UploadResult> {
  try {
    console.log(`[Upload] Starting upload to bucket: ${bucket}`);
    
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Get current user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      throw new Error(`Authentication error: ${userErr.message}`);
    }
    const userId = userData.user?.id;
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    // Prepare file metadata
    const originalName = filenameFromUri(fileUri);
    const ext = originalName.includes('.') ? originalName.split('.').pop() ?? 'jpg' : 'jpg';
    const contentType = mimeFromExt(ext);
    const timestamp = Date.now();
    const path = `${bucket}/${userId}/${timestamp}-${originalName}`;

    console.log(`[Upload] Uploading to path: ${path}`);

    // Read file as blob
    const res = await fetch(fileUri);
    if (!res.ok) {
      throw new Error(`Failed to read file: ${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: blob.type || contentType,
        upsert: false,
      });
    
    if (upErr) {
      throw new Error(`Upload failed: ${upErr.message}`);
    }

    // Get public URL
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!pub?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    const result = { url: pub.publicUrl, path };
    console.log(`[Upload] Success:`, result);
    showToast('Image uploaded successfully!');
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    console.error('[Upload] Error:', message);
    showToast(message, true);
    throw error;
  }
}

/**
 * Opens image picker and uploads selected image
 * @param bucket - Storage bucket: 'avatars', 'post-media', or 'restaurant-photos'
 * @param options - Optional picker configuration
 * @returns Promise with upload result or null if cancelled
 */
export async function pickAndUploadImage(
  bucket: StorageBucket,
  options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }
): Promise<UploadResult | null> {
  try {
    // Request permissions
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      showToast('Media library permission is required to upload images', true);
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      console.log('[Upload] Image picker cancelled');
      return null;
    }

    return await uploadImageAsync(result.assets[0].uri, bucket);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to pick and upload image';
    console.error('[Upload] Pick and upload error:', message);
    showToast(message, true);
    throw error;
  }
}

/**
 * Takes a photo with camera and uploads it
 * @param bucket - Storage bucket: 'avatars', 'post-media', or 'restaurant-photos'
 * @param options - Optional camera configuration
 * @returns Promise with upload result or null if cancelled
 */
export async function takePhotoAndUpload(
  bucket: StorageBucket,
  options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }
): Promise<UploadResult | null> {
  try {
    // Request camera permissions
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      showToast('Camera permission is required to take photos', true);
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      console.log('[Upload] Camera cancelled');
      return null;
    }

    return await uploadImageAsync(result.assets[0].uri, bucket);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to take photo and upload';
    console.error('[Upload] Camera upload error:', message);
    showToast(message, true);
    throw error;
  }
}
