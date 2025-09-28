import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import Protected from '@/components/Protected';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/utils/supabaseUpload';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const profileQuery = trpc.auth.getCurrentProfile.useQuery();

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQuery.queryKey });
    },
  });

  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  React.useEffect(() => {
    if (profileQuery.data) {
      setDisplayName(profileQuery.data.display_name ?? '');
      setAvatarUrl(profileQuery.data.avatar_url ?? '');
    }
  }, [profileQuery.data]);

  const onSave = async () => {
    await updateMutation.mutateAsync({ display_name: displayName, avatar_url: avatarUrl });
    Alert.alert('Saved', 'Profile updated');
  };

  const onChangeAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) return;
      const uri = picked.assets[0].uri;
      const { url } = await uploadImageAsync(uri, 'avatars');
      setAvatarUrl(url);
      await updateMutation.mutateAsync({ avatar_url: url });
      await profileQuery.refetch();
      Alert.alert('Updated', 'Avatar changed successfully');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    }
  };

  return (
    <Protected>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView contentContainerStyle={styles.container} testID="profile-screen">
        <Image
          source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1544435253-f0ead49638b9?w=300&h=300&fit=crop' }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.changeAvatarBtn} onPress={onChangeAvatar} testID="change-avatar">
          <Text style={styles.changeAvatarText}>Change Avatar</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Display Name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" />

        <Text style={styles.label}>Avatar URL</Text>
        <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://…" autoCapitalize="none" />

        <TouchableOpacity style={styles.button} onPress={onSave} disabled={updateMutation.isPending}>
          <Text style={styles.buttonText}>{updateMutation.isPending ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={signOut}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignSelf: 'center', marginBottom: 8 },
  label: { fontWeight: '700', color: Colors.light.text },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, color: Colors.light.text },
  button: { backgroundColor: Colors.light.tint, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  secondary: { backgroundColor: '#ef4444' },
  buttonText: { color: 'white', fontWeight: '800' },
  changeAvatarBtn: { alignSelf: 'center', backgroundColor: Colors.light.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: Colors.light.border },
  changeAvatarText: { color: Colors.light.text, fontWeight: '600' },
});
