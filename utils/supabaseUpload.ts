import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

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

export async function uploadImageAsync(fileUri: string, bucket: string): Promise<UploadResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    throw new Error(userErr.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const originalName = filenameFromUri(fileUri);
  const ext = originalName.includes('.') ? originalName.split('.').pop() ?? 'jpg' : 'jpg';
  const contentType = mimeFromExt(ext);
  const path = `${bucket}/${userId}/${Date.now()}-${originalName}`;

  const res = await fetch(fileUri);
  if (!res.ok) {
    throw new Error(`Failed to read file: ${res.status}`);
  }
  const blob = await res.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: blob.type || contentType,
    upsert: false,
  });
  if (upErr) {
    throw new Error(upErr.message);
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!pub?.publicUrl) {
    throw new Error('Failed to get public URL');
  }
  return { url: pub.publicUrl, path };
}

export async function pickAndUploadImage(bucket: string): Promise<UploadResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') {
    throw new Error('Media library permission not granted');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return uploadImageAsync(result.assets[0].uri, bucket);
}
