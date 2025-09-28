import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Bell, Smartphone } from 'lucide-react-native';
import { useNotifications } from '@/providers/NotificationProvider';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';

export default function PushNotificationDemoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { expoPushToken, permissionStatus } = useNotifications();
  const [title, setTitle] = useState<string>('Test Notification');
  const [body, setBody] = useState<string>('This is a test push notification!');
  const [sending, setSending] = useState<boolean>(false);

  const sendTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('Error', 'No push token available. Please ensure notifications are enabled.');
      return;
    }

    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and body for the notification.');
      return;
    }

    setSending(true);
    try {
      const message = {
        to: expoPushToken,
        sound: 'default' as const,
        title: title.trim(),
        body: body.trim(),
        data: { screen: 'notifications-demo' },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('[Push Demo] Send result:', result);
      
      if (result.data?.[0]?.status === 'ok') {
        Alert.alert('Success', 'Test notification sent successfully!');
      } else {
        Alert.alert('Error', result.data?.[0]?.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('[Push Demo] Send error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  const canSendNotification = expoPushToken && permissionStatus === 'granted' && Platform.OS !== 'web';

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Push Notification Demo',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
        }} 
      />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Smartphone size={48} color={Colors.light.tint} />
          <Text style={styles.title}>Push Notification Test</Text>
          <Text style={styles.subtitle}>Send yourself a test notification</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              User: {user ? user.email : 'Not logged in'}{"\n"}
              Permission: {permissionStatus || 'Unknown'}{"\n"}
              Token: {expoPushToken ? 'Available' : 'Not available'}
            </Text>
          </View>
        </View>

        {canSendNotification ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Content</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter notification title"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Body</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={body}
                  onChangeText={setBody}
                  placeholder="Enter notification body"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.buttonDisabled]}
              onPress={sendTestNotification}
              disabled={sending}
            >
              <Send size={20} color="white" />
              <Text style={styles.buttonText}>
                {sending ? 'Sending...' : 'Send Test Notification'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <Bell size={24} color="#FFA500" />
              <Text style={styles.warningText}>
                {Platform.OS === 'web' 
                  ? 'Push notifications are not supported on web. Please test on a mobile device.'
                  : !user 
                  ? 'Please log in to test push notifications.'
                  : !expoPushToken 
                  ? 'Push token not available. Please enable notifications.'
                  : 'Notifications permission not granted.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              1. Make sure you're logged in{"\n"}
              2. Grant notification permissions when prompted{"\n"}
              3. Enter a title and body for your test notification{"\n"}
              4. Tap "Send Test Notification"{"\n"}
              5. You should receive the notification immediately{"\n"}
              6. If the app is in foreground, you'll see a toast{"\n"}
              7. If the app is in background, you'll see a system notification
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
    textAlign: 'center',
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
  statusText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
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