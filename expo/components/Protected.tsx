import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';

interface ProtectedProps {
  children: React.ReactNode;
  testID?: string;
}

export default function Protected({ children, testID }: ProtectedProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      console.log('[Protected] No user, redirecting to /auth/login from', pathname);
      router.replace('/auth/login' as const);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <View style={styles.center} testID={testID ?? 'protected-loading'}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
});
