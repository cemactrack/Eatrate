import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function HomeLayout() {
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
        name="home" 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
    </Stack>
  );
}