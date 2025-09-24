import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
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