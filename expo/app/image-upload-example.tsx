import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { type StorageBucket, type UploadResult } from '@/utils/supabaseUpload';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/providers/AuthProvider';

export default function ImageUploadExample() {
  const { user } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<(UploadResult & { bucket: string })[]>([]);
  const [currentBucket, setCurrentBucket] = useState<StorageBucket>('avatars');

  const { isUploading, pickImage, takePhoto } = useImageUpload({
    bucket: currentBucket,
    onSuccess: (result) => {
      setUploadedImages(prev => [...prev, { ...result, bucket: currentBucket }]);
      console.log('Upload successful:', result);
    },
    onError: (error) => {
      console.error('Upload failed:', error.message);
    },
  });

  const handlePickAndUpload = async (bucket: StorageBucket) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to upload images');
      return;
    }

    setCurrentBucket(bucket);
    await pickImage({
      allowsEditing: true,
      aspect: bucket === 'avatars' ? [1, 1] : undefined,
      quality: 0.8,
    });
  };

  const handleTakePhoto = async (bucket: StorageBucket) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to upload images');
      return;
    }

    setCurrentBucket(bucket);
    await takePhoto({
      allowsEditing: true,
      aspect: bucket === 'avatars' ? [1, 1] : undefined,
      quality: 0.8,
    });
  };

  const clearUploads = () => {
    setUploadedImages([]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Image Upload Demo' }} />
        <Text style={styles.loginMessage}>Please log in to test image uploads</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Image Upload Demo' }} />
      
      <Text style={styles.title}>Image Upload Demo</Text>
      <Text style={styles.subtitle}>Logged in as: {user.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatar Upload (1:1 aspect)</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handlePickAndUpload('avatars')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Pick Avatar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handleTakePhoto('avatars')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Take Avatar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Post Media Upload</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handlePickAndUpload('post-media')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Pick Post Image</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handleTakePhoto('post-media')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Take Post Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Photos Upload</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handlePickAndUpload('restaurant-photos')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Pick Restaurant Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, isUploading && styles.buttonDisabled]} 
            onPress={() => handleTakePhoto('restaurant-photos')}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Take Restaurant Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isUploading && (
        <View style={styles.uploadingContainer}>
          <Text style={styles.uploadingText}>Uploading image...</Text>
        </View>
      )}

      {uploadedImages.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Uploaded Images ({uploadedImages.length})</Text>
            <TouchableOpacity onPress={clearUploads} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {uploadedImages.map((item, index) => (
            <View key={index} style={styles.imageItem}>
              <Image source={{ uri: item.url }} style={styles.uploadedImage} />
              <View style={styles.imageInfo}>
                <Text style={styles.imageInfoText}>Bucket: {item.bucket}</Text>
                <Text style={styles.imageInfoText} numberOfLines={1}>Path: {item.path}</Text>
                <Text style={styles.imageInfoText} numberOfLines={1}>URL: {item.url}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  loginMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginTop: 100,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  uploadingText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '600',
  },
  imageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  imageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  imageInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});