import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ImageUploader } from '@/components/ImageUploader';

export default function ImageUploadExample() {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarPath, setAvatarPath] = useState<string>('');
  const [restaurantPhotoUrl, setRestaurantPhotoUrl] = useState<string>('');
  const [restaurantPhotoPath, setRestaurantPhotoPath] = useState<string>('');
  const [postMediaUrl, setPostMediaUrl] = useState<string>('');
  const [postMediaPath, setPostMediaPath] = useState<string>('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Image Upload Examples</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar Upload</Text>
          <Text style={styles.sectionDescription}>
            Upload a profile picture (1:1 aspect ratio)
          </Text>
          <ImageUploader
            category="avatar"
            currentImageUrl={avatarUrl}
            onImageUploaded={(url, path) => {
              setAvatarUrl(url);
              setAvatarPath(path);
              console.log('Avatar uploaded:', { url, path });
            }}
            onImageDeleted={() => {
              setAvatarUrl('');
              setAvatarPath('');
              console.log('Avatar deleted');
            }}
            placeholder="Upload Avatar"
            aspect={[1, 1]}
            style={styles.uploader}
          />
          {avatarPath && (
            <Text style={styles.pathText}>Path: {avatarPath}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Photo</Text>
          <Text style={styles.sectionDescription}>
            Upload a restaurant photo (4:3 aspect ratio)
          </Text>
          <ImageUploader
            category="restaurant-photo"
            currentImageUrl={restaurantPhotoUrl}
            onImageUploaded={(url, path) => {
              setRestaurantPhotoUrl(url);
              setRestaurantPhotoPath(path);
              console.log('Restaurant photo uploaded:', { url, path });
            }}
            onImageDeleted={() => {
              setRestaurantPhotoUrl('');
              setRestaurantPhotoPath('');
              console.log('Restaurant photo deleted');
            }}
            metadata={{ restaurantId: 'restaurant-123' }}
            placeholder="Upload Restaurant Photo"
            aspect={[4, 3]}
            style={styles.uploader}
            imageStyle={styles.restaurantImage}
          />
          {restaurantPhotoPath && (
            <Text style={styles.pathText}>Path: {restaurantPhotoPath}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Media</Text>
          <Text style={styles.sectionDescription}>
            Upload media for a social post (16:9 aspect ratio)
          </Text>
          <ImageUploader
            category="post-media"
            currentImageUrl={postMediaUrl}
            onImageUploaded={(url, path) => {
              setPostMediaUrl(url);
              setPostMediaPath(path);
              console.log('Post media uploaded:', { url, path });
            }}
            onImageDeleted={() => {
              setPostMediaUrl('');
              setPostMediaPath('');
              console.log('Post media deleted');
            }}
            metadata={{ postId: 'post-456' }}
            placeholder="Upload Post Media"
            aspect={[16, 9]}
            style={styles.uploader}
            imageStyle={styles.postImage}
          />
          {postMediaPath && (
            <Text style={styles.pathText}>Path: {postMediaPath}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    gap: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  uploader: {
    marginBottom: 10,
  },
  restaurantImage: {
    width: 280,
    height: 210,
  },
  postImage: {
    width: 320,
    height: 180,
  },
  pathText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginTop: 5,
  },
});