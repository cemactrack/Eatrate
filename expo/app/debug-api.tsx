import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBase } from '@/lib/config';

export default function DebugApiScreen() {
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  React.useEffect(() => {
    const info = {
      envApiUrl: process.env.EXPO_PUBLIC_API_URL,
      configApiBase: getApiBase(),
      finalTrpcUrl: `${getApiBase()}/api/trpc`,
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
    console.log('[Debug] API Configuration:', info);
  }, []);

  const testConnection = async () => {
    try {
      console.log('[Debug] Testing connection...');
      const response = await fetch(`${getApiBase()}/api/health`);
      const data = await response.json();
      console.log('[Debug] Health check response:', data);
      setDebugInfo(prev => ({ ...prev, healthCheck: { success: true, data } }));
    } catch (error) {
      console.error('[Debug] Health check failed:', error);
      setDebugInfo(prev => ({ ...prev, healthCheck: { success: false, error: error.message } }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
      <Text style={styles.title}>API Debug Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Variables</Text>
        <Text style={styles.code}>EXPO_PUBLIC_API_URL: {debugInfo.envApiUrl || 'undefined'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Computed URLs</Text>
        <Text style={styles.code}>Config API Base: {debugInfo.configApiBase}</Text>
        <Text style={styles.code}>Final tRPC URL: {debugInfo.finalTrpcUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Check</Text>
        <Button title="Test Connection" onPress={testConnection} />
        {debugInfo.healthCheck && (
          <View style={styles.healthResult}>
            <Text style={[styles.code, { color: debugInfo.healthCheck.success ? 'green' : 'red' }]}>
              Status: {debugInfo.healthCheck.success ? 'SUCCESS' : 'FAILED'}
            </Text>
            {debugInfo.healthCheck.data && (
              <Text style={styles.code}>
                Response: {JSON.stringify(debugInfo.healthCheck.data, null, 2)}
              </Text>
            )}
            {debugInfo.healthCheck.error && (
              <Text style={[styles.code, { color: 'red' }]}>
                Error: {debugInfo.healthCheck.error}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Debug Info</Text>
        <Text style={styles.code}>{JSON.stringify(debugInfo, null, 2)}</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  healthResult: {
    marginTop: 8,
  },
});