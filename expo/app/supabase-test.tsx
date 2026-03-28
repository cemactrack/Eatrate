import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function SupabaseTestScreen() {
  const [table, setTable] = useState<string>('users');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.example.supabaseTest.query({ table });
      setResult(response);
    } catch (err) {
      console.error('Error testing Supabase connection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const tables = ['users', 'restaurants', 'posts', 'comments', 'dishes'];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Supabase Test' }} />
      
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <View style={styles.tableSelector}>
        <Text style={styles.label}>Select a table to test:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tablesScroll}>
          {tables.map((t) => {
            // Validate table name
            const validTableName = t.trim();
            if (!validTableName || validTableName.length > 50) return null;
            
            return (
            <TouchableOpacity
              key={t}
              style={[styles.tableButton, table === t && styles.selectedTable]}
              onPress={() => {
                // Validate table name before setting
                const sanitizedTable = t.trim();
                if (sanitizedTable && sanitizedTable.length <= 50) {
                  setTable(sanitizedTable);
                }
              }}
            >
              <Text style={[styles.tableButtonText, table === t && styles.selectedTableText]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={styles.testButton} 
        onPress={testSupabaseConnection}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.testButtonText}>Test Connection</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            Status: {result.success ? '✅ Success' : '❌ Failed'}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          
          {result.connectionInfo && (
            <View style={styles.connectionInfo}>
              <Text style={styles.infoTitle}>Connection Info:</Text>
              <Text style={styles.infoText}>URL: {result.connectionInfo.url}</Text>
              <Text style={styles.infoText}>
                Using Service Key: {result.connectionInfo.usingServiceKey ? 'Yes' : 'No'}
              </Text>
            </View>
          )}

          {result.data && (
            <View style={styles.dataContainer}>
              <Text style={styles.infoTitle}>Data:</Text>
              <Text style={styles.dataText}>
                {JSON.stringify(result.data, null, 2)}
              </Text>
            </View>
          )}

          {result.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.infoTitle}>Error Details:</Text>
              <Text style={styles.dataText}>
                {JSON.stringify(result.error, null, 2)}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 24,
    textAlign: 'center',
  },
  tableSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  tablesScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedTable: {
    backgroundColor: '#2196F3',
  },
  tableButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  selectedTableText: {
    color: 'white',
  },
  testButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  connectionInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dataContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  errorDetails: {
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
  },
});