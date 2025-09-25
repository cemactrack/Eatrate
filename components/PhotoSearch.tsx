import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera, Upload, X, Loader2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpcClient } from '@/lib/trpc';

interface PhotoSearchProps {
  onResults: (results: any) => void;
  onClose: () => void;
}

export default function PhotoSearch({ onResults, onClose }: PhotoSearchProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Using trpcClient for direct API calls

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Camera roll permissions not granted');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        await analyzeImage(result.assets[0].base64);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Camera permissions not granted');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        await analyzeImage(result.assets[0].base64);
      }
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const results = await trpcClient.restaurants.searchByPhoto.query({
        imageBase64: base64Image,
        location: 'all',
        limit: 10,
      });

      console.log('Photo search results:', results);
      onResults(results);
    } catch (error) {
      console.error('Photo analysis failed:', error);
      console.error('Analysis Failed: Could not analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setIsAnalyzing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search by Photo</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Take a photo of food or upload from your gallery to find similar restaurants
      </Text>

      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <TouchableOpacity onPress={clearImage} style={styles.clearButton}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
          
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <Loader2 size={32} color="#fff" />
              <Text style={styles.analyzingText}>Analyzing image...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            onPress={takePhoto} 
            style={[styles.actionButton, styles.cameraButton]}
            disabled={isAnalyzing}
          >
            <Camera size={32} color="#fff" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickImage} 
            style={[styles.actionButton, styles.galleryButton]}
            disabled={isAnalyzing}
          >
            <Upload size={32} color="#fff" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>Tips for better results:</Text>
        <Text style={styles.tipText}>• Take clear, well-lit photos of food</Text>
        <Text style={styles.tipText}>• Focus on the main dish</Text>
        <Text style={styles.tipText}>• Avoid blurry or dark images</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  actionContainer: {
    gap: 16,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});