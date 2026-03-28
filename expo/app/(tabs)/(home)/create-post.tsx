import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import PostComposer from '@/components/PostComposer';
import Colors from '@/constants/colors';

export default function CreatePostScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Create Post',
          headerShown: false,
        }} 
      />
      <PostComposer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});