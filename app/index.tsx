import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      // Add small delay to ensure providers are fully initialized
      const timeoutId = setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  if (isLoading || !shouldRedirect) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)/(home)/home' : '/welcome'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});