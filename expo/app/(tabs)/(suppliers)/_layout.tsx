import { Stack } from 'expo-router';
import React from 'react';
import { useSettings } from '@/providers/SettingsProvider';

export default function SuppliersLayout() {
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
        name="suppliers" 
        options={{ 
          headerShown: false,
          title: 'Suppliers'
        }} 
      />
    </Stack>
  );
}