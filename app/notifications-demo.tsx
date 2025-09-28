import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';

export default function NotificationsDemoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { expoPushToken, permissionStatus, requestPermission, loading } = useNotifications();

  const getStatusIcon = () => {
    if (Platform.OS === 'web') {
      return <AlertCircle size={24} color="#FFA500" />;
    }
    
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'denied':
        return <XCircle size={24} color="#F44336" />;
      default:
        return <AlertCircle size={24} color="#FFA500" />;
    }
  };

  const getStatusText = () => {
    if (Platform.OS === 'web') {
      return 'Not supported on web';
    }
    
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications denied';
      case 'undetermined':
        return 'Permission not requested';
      default:
        return 'Unknown status';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Notifications Demo',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
        }} 
      />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Bell size={48} color={Colors.light.tint} />
          <Text style={styles.title}>Push Notifications</Text>
          <Text style={styles.subtitle}>Demo & Status</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              {user ? `Logged in as: ${user.email}` : 'Not logged in'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              {getStatusIcon()}
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        </View>

        {expoPushToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Token</Text>
            <View style={styles.tokenCard}>
              <Text style={styles.tokenText} numberOfLines={3}>
                {expoPushToken}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {Platform.OS !== 'web' && (
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={requestPermission}
              disabled={loading}
            >
              <Bell size={20} color="white" />
              <Text style={styles.buttonText}>
                {loading ? 'Requesting...' : 'Request Permission'}
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === 'web' && (
            <View style={styles.webNotice}>
              <AlertCircle size={20} color="#FFA500" />
              <Text style={styles.webNoticeText}>
                Push notifications are not supported on web. Please test on a mobile device.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              1. After login, permission is automatically requested{"\n"}
              2. If granted, the Expo push token is saved to the database{"\n"}
              3. Foreground notifications show as toast messages{"\n"}
              4. Background notifications appear in the system tray
            </Text>
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
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  tokenCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});