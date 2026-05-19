import React from 'react';
import { Redirect } from 'expo-router';

// Login disabled: always go straight to home
export default function Index() {
  return <Redirect href={'/(tabs)/(home)/home'} />;
}