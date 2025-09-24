import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.light.background },
      headerTintColor: Colors.light.text,
      headerTitleStyle: { fontWeight: '700' },
      headerBackTitle: 'Back',
    }}>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Admin Dashboard',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          title: 'User Management',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="moderation" 
        options={{ 
          title: 'Content Moderation',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Admin Notifications',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Platform Settings',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}