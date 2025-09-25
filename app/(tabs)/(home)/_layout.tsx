import { Stack } from 'expo-router';
import React from 'react';
import { useSettings } from '@/providers/SettingsProvider';

export default function HomeLayout() {
  const { colors } = useSettings();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="home" 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Stack.Screen 
        name="create-post" 
        options={{ 
          headerShown: false,
          title: 'Create Post',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}