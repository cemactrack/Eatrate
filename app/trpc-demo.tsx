import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { trpc, trpcStandaloneClient } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function TRPCDemo() {
  const [standaloneResult, setStandaloneResult] = useState<string>('');
  const [isStandaloneLoading, setIsStandaloneLoading] = useState<boolean>(false);

  // React Query tRPC hooks
  const healthQuery = trpc.healthCheck.useQuery();
  const restaurantsQuery = trpc.restaurants.list.useQuery();
  const postsQuery = trpc.posts.list.useQuery();

  // Example of using standalone client (for non-React contexts)
  const handleStandaloneCall = async () => {
    setIsStandaloneLoading(true);
    try {
      const result = await trpcStandaloneClient.healthCheck.query();
      setStandaloneResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Standalone tRPC call failed:', error);
      setStandaloneResult('Error: ' + (error as Error).message);
    } finally {
      setIsStandaloneLoading(false);
    }
  };

  const renderQueryResult = (title: string, query: any) => (
    <View style={styles.querySection}>
      <Text style={styles.queryTitle}>{title}</Text>
      {query.isLoading ? (
        <ActivityIndicator size="small" color={Colors.light.tint} />
      ) : query.error ? (
        <Text style={styles.errorText}>
          Error: {query.error.message}
        </Text>
      ) : (
        <Text style={styles.resultText}>
          {JSON.stringify(query.data, null, 2)}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'tRPC Demo',
          headerShown: true,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>tRPC Client Demo</Text>
        <Text style={styles.subtitle}>
          Testing React Query hooks and standalone client
        </Text>

        {renderQueryResult('Health Check', healthQuery)}
        {renderQueryResult('Restaurants', restaurantsQuery)}
        {renderQueryResult('Posts', postsQuery)}

        <View style={styles.standaloneSection}>
          <Text style={styles.queryTitle}>Standalone Client Test</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleStandaloneCall}
            disabled={isStandaloneLoading}
          >
            {isStandaloneLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Call Standalone Client</Text>
            )}
          </TouchableOpacity>
          
          {standaloneResult ? (
            <Text style={styles.resultText}>{standaloneResult}</Text>
          ) : null}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Usage Examples:</Text>
          <Text style={styles.infoText}>
            • React hooks: trpc.restaurants.list.useQuery()
          </Text>
          <Text style={styles.infoText}>
            • Mutations: trpc.posts.create.useMutation()
          </Text>
          <Text style={styles.infoText}>
            • Standalone: await trpcStandaloneClient.healthCheck.query()
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 8,
  },
  querySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  standaloneSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  queryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    maxHeight: 150,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});