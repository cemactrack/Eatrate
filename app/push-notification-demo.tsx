import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function PushNotificationDemoScreen() {
  const { user } = useAuth();
  const { pushToken, permissionStatus, loading, requestPermission, registerPushToken } = useNotifications();
  const [testingNotification, setTestingNotification] = useState(false);

  const getStatusColor = (status: string | null) => {
    if (!status) return '#9E9E9E';
    
    switch (status) {
      case 'granted': return Colors.light.success || '#4CAF50';
      case 'denied': return Colors.light.error || '#F44336';
      case 'undetermined': return Colors.light.warning || '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string | null) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'granted': return 'Granted ✅';
      case 'denied': return 'Denied ❌';
      case 'undetermined': return 'Not Asked Yet ⏳';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle size={24} color={getStatusColor(status)} />;
    
    switch (status) {
      case 'granted': return <CheckCircle size={24} color={getStatusColor(status)} />;
      case 'denied': return <BellOff size={24} color={getStatusColor(status)} />;
      case 'undetermined': return <Bell size={24} color={getStatusColor(status)} />;
      default: return <AlertCircle size={24} color={getStatusColor(status)} />;
    }
  };

  const triggerLocalNotification = async () => {
    if (permissionStatus !== 'granted') {
      console.log('[Demo] Cannot send test notification - permission not granted');
      return;
    }

    setTestingNotification(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from the app!',
          data: { screen: 'push-notification-demo' },
        },
        trigger: null, // Send immediately
      });
      console.log('[Demo] Test notification sent');
    } catch (error) {
      console.error('[Demo] Error sending test notification:', error);
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Push Notifications',
          headerStyle: { backgroundColor: Colors.light.tint },
          headerTintColor: '#fff',
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView>
        <View style={styles.header}>
          <Bell size={32} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Push Notification Setup</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>User:</Text>
            <Text style={styles.statusValue}>
              {user ? `${user.email || user.id} ✅` : 'Not logged in ❌'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Permission</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIconContainer}>
                {getStatusIcon(permissionStatus)}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(permissionStatus) }]}>
                  {loading ? 'Loading...' : getStatusText(permissionStatus)}
                </Text>
              </View>
            </View>
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
            {loading ? (
              <ActivityIndicator size="small" color={Colors.light.tint} style={styles.activityIndicator} />
            ) : (
              <Text style={styles.tokenText} numberOfLines={3}>
                {pushToken || 'No token yet'}
              </Text>
            )}
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

          {permissionStatus === 'granted' && pushToken && (
            <TouchableOpacity 
              style={[styles.button, testingNotification && styles.buttonDisabled]} 
              onPress={triggerLocalNotification}
              disabled={testingNotification}
            >
              {testingNotification ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <Text style={styles.buttonText}>Send Test Notification</Text>
              )}
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
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>User logs in</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>App requests notification permission</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>If granted, gets Expo push token</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>Saves token to database via tRPC</Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>5</Text>
              <Text style={styles.stepText}>Shows toast for foreground notifications</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 12,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.tabIconDefault || '#ccc',
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  activityIndicator: {
    marginTop: 8,
  },
});