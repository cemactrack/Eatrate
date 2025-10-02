import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/src/ui';

export default function DeleteAccountScreen() {
  const { logout } = useAuth();

  const handleDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            // In a real app, you would call your backend to delete the user's data.
            // For this demo, we'll just log them out.
            await logout();
            router.replace('/login');
            Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.warningText}>
        This is a permanent action. Once you delete your account, all of your data, including reviews, photos, and personal information, will be erased forever. You will not be able to recover your account.
      </Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Cancel
      </Button>
      <View style={{ height: 12 }} />
      <Button variant="primary" onPress={handleDelete}>
        I understand, delete my account
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#0E0E10',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#B9BBC6',
    textAlign: 'center',
    marginBottom: 32,
  },
});
