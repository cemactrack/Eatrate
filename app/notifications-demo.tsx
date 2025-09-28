import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';

export default function NotificationsDemoScreen() {
  const { user } = useAuth();
  const { pushToken, permissionStatus, loading, requestPermission, registerPushToken } = useNotifications();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'granted': return '#4CAF50';
      case 'denied': return '#F44336';
      case 'undetermined': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'granted': return 'Granted ✅';
      case 'denied': return 'Denied ❌';
      case 'undetermined': return 'Not Asked Yet ⏳';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Notifications Demo',
          headerStyle: { backgroundColor: Colors.light.tint },
          headerTintColor: '#fff',
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>User:</Text>
            <Text style={styles.statusValue}>
              {user ? `${user.email} ✅` : 'Not logged in ❌'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Permission</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(permissionStatus) }]}>
              {loading ? 'Loading...' : getStatusText(permissionStatus)}
            </Text>
          </View>
          
          {permissionStatus !== 'granted' && (
            <TouchableOpacity 
              style={styles.button} 
              onPress={requestPermission}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Request Permission</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Token</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Token:</Text>
            <Text style={styles.tokenText} numberOfLines={3}>
              {pushToken || 'No token yet'}
            </Text>
          </View>
          
          {user && permissionStatus === 'granted' && !pushToken && (
            <TouchableOpacity 
              style={styles.button} 
              onPress={registerPushToken}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Register Push Token</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Storage</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Push tokens are stored in the <Text style={styles.codeText}>profiles.push_token</Text> field in Supabase.
            </Text>
            <Text style={styles.infoText}>
              The tRPC endpoint <Text style={styles.codeText}>auth.updatePushToken</Text> handles saving tokens to the database.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.stepText}>1. User logs in</Text>
            <Text style={styles.stepText}>2. App requests notification permission</Text>
            <Text style={styles.stepText}>3. If granted, gets Expo push token</Text>
            <Text style={styles.stepText}>4. Saves token to database via tRPC</Text>
            <Text style={styles.stepText}>5. Shows toast for foreground notifications</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.light.text,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
    paddingLeft: 8,
  },
});
