import { Stack } from 'expo-router';
import React from 'react';
import { useSettings } from '@/providers/SettingsProvider';

export default function SearchLayout() {
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
        name="search" 
        options={{ 
          headerShown: false,
          title: 'Search'
        }} 
      />
    </Stack>
  );
}