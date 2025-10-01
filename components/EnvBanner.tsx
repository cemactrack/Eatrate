import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getEnv } from '@/lib/env';

export default function EnvBanner() {
  if (Platform.OS === 'web' && process.env.NODE_ENV === 'production') {
    return null;
  }

  let env: ReturnType<typeof getEnv> | null = null;
  let error: string | null = null;

  try {
    env = getEnv(false);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  if (error) {
    return (
      <View style={styles.banner}>
        <Text style={styles.errorText}>⚠️ ENV ERROR: {error}</Text>
      </View>
    );
  }

  if (!env) return null;

  const maskKey = (key: string) => {
    if (!key || key.length < 20) return '***';
    return key.slice(0, 10) + '...' + key.slice(-10);
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🔧 API: {env.API_URL || 'NOT SET'}</Text>
      <Text style={styles.text}>🗄️ Supabase: {env.SUPABASE_URL || 'NOT SET'}</Text>
      <Text style={styles.text}>🔑 Anon Key: {env.SUPABASE_ANON_KEY ? maskKey(env.SUPABASE_ANON_KEY) : 'NOT SET'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  text: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    marginVertical: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
});
