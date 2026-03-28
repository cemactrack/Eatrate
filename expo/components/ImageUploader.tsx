import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, ImageIcon, Trash2, Upload } from 'lucide-react-native';
import { useImageUpload, ImageUploadCategory, ImageUploadOptions } from '@/hooks/useImageUpload';

interface ImageUploaderProps {
  category: ImageUploadCategory;
  currentImageUrl?: string;
  onImageUploaded?: (url: string, path: string) => void;
  onImageDeleted?: () => void;
  metadata?: {
    restaurantId?: string;
    postId?: string;
  };
  style?: any;
  imageStyle?: any;
  placeholder?: string;
  showDeleteButton?: boolean;
  disabled?: boolean;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  category,
  currentImageUrl,
  onImageUploaded,
  onImageDeleted,
  metadata,
  style,
  imageStyle,
  placeholder = 'Tap to upload image',
  showDeleteButton = true,
  disabled = false,
  quality = 0.8,
  allowsEditing = true,
  aspect = [1, 1],
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const { pickImage, takePhoto, deleteImage, isUploading, uploadProgress, isDeleting } = useImageUpload();

  const uploadOptions: ImageUploadOptions = {
    category,
    metadata,
    quality,
    allowsEditing,
    aspect,
  };

  const showImagePicker = () => {
    if (disabled) return;

    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        {
          text: 'Camera',
          onPress: handleTakePhoto,
        },
        {
          text: 'Photo Library',
          onPress: handlePickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handlePickImage = async () => {
    const result = await pickImage(uploadOptions);
    
    if (result.success && result.url && result.path) {
      setCurrentPath(result.path);
      onImageUploaded?.(result.url, result.path);
    } else if (result.error) {
      Alert.alert('Upload Error', result.error);
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto(uploadOptions);
    
    if (result.success && result.url && result.path) {
      setCurrentPath(result.path);
      onImageUploaded?.(result.url, result.path);
    } else if (result.error) {
      Alert.alert('Upload Error', result.error);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentPath && !currentImageUrl) return;

    const performDelete = async () => {
      if (currentPath) {
        const result = await deleteImage(currentPath);
        if (result.success) {
          setCurrentPath('');
          onImageDeleted?.();
        } else if (result.error) {
          console.error('Delete Error:', result.error);
        }
      } else {
        // If no current path, just clear the image
        onImageDeleted?.();
      }
    };

    // For web compatibility, use a simpler confirmation
    if (typeof window !== 'undefined' && window.navigator) {
      // Web environment
      const shouldDelete = window.confirm('Are you sure you want to delete this image?');
      if (shouldDelete) {
        await performDelete();
      }
    } else {
      // Mobile environment
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const renderUploadButton = () => (
    <TouchableOpacity
      style={[styles.uploadButton, disabled && styles.disabled]}
      onPress={showImagePicker}
      disabled={disabled || isUploading}
    >
      {isUploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>
            Uploading... {Math.round(uploadProgress)}%
          </Text>
        </View>
      ) : (
        <View style={styles.uploadContent}>
          <Upload size={24} color="#007AFF" />
          <Text style={styles.uploadText}>{placeholder}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderImageWithControls = () => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: currentImageUrl }}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
      />
      
      {showDeleteButton && (
        <View style={styles.imageControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={showImagePicker}
            disabled={disabled || isUploading}
          >
            <Camera size={16} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.deleteButton]}
            onPress={handleDeleteImage}
            disabled={disabled || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Trash2 size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {currentImageUrl ? renderImageWithControls() : renderUploadButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: '#F8F9FA',
  },
  disabled: {
    opacity: 0.5,
    borderColor: '#CCC',
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },
});