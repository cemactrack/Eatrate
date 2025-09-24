import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const initialDisplayName = useMemo<string>(() => user?.displayName ?? '', [user?.displayName]);
  const initialAvatar = useMemo<string>(() => user?.avatar ?? '', [user?.avatar]);

  const [displayName, setDisplayName] = useState<string>(initialDisplayName);
  const [avatar, setAvatar] = useState<string>(initialAvatar);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [picking, setPicking] = useState<boolean>(false);

  const onCancel = useCallback(() => {
    console.log('[EditProfile] Cancel pressed');
    router.back();
  }, [router]);

  const validate = useCallback((): string | null => {
    const name = displayName?.trim() ?? '';
    if (!name) return 'Display name is required';
    if (name.length > 50) return 'Display name must be under 50 characters';
    if (avatar?.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        return 'Avatar must be a valid URL';
      }
    }
    return null;
  }, [displayName, avatar]);

  const pickFromLibrary = useCallback(async () => {
    try {
      setPicking(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error('[EditProfile] pickFromLibrary error', e);
    } finally {
      setPicking(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      setPicking(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error('[EditProfile] takePhoto error', e);
    } finally {
      setPicking(false);
    }
  }, []);

  const onSave = useCallback(async () => {
    console.log('[EditProfile] Save pressed');
    const v = validate();
    if (v) {
      setError(v);
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid input', v);
      } else {
        console.warn('[EditProfile] validation error:', v);
      }
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), avatar: avatar.trim() || undefined });
      console.log('[EditProfile] Profile updated');
      router.back();
    } catch (e) {
      console.error('[EditProfile] update error', e);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [avatar, displayName, router, updateProfile, validate]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }] }>
      <Stack.Screen options={{ title: 'Edit Profile' }} />

      <View style={styles.form}>
        <View style={styles.avatarRow}>
          <Image
            source={{ uri: avatar?.trim() || 'https://images.unsplash.com/photo-1544435253-f0ead49638b9?w=200&h=200&fit=crop' }}
            style={styles.avatar}
          />
          <View style={styles.avatarActions}>
            <TouchableOpacity
              testID="pick-avatar-library"
              onPress={pickFromLibrary}
              style={[styles.smallButton, styles.libraryBtn]}
              disabled={picking}
            >
              <ImageIcon size={16} color={Colors.light.tint} />
              <Text style={styles.smallButtonText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="pick-avatar-camera"
              onPress={takePhoto}
              style={[styles.smallButton, styles.cameraBtn]}
              disabled={picking}
            >
              <Camera size={16} color={Colors.light.tint} />
              <Text style={styles.smallButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          testID="display-name-input"
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={Colors.light.secondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoCorrect
          maxLength={50}
          returnKeyType="done"
        />

        <Text style={styles.label}>Avatar URL</Text>
        <TextInput
          testID="avatar-url-input"
          style={styles.input}
          placeholder="https://... or leave as picked image"
          placeholderTextColor={Colors.light.secondary}
          value={avatar}
          onChangeText={setAvatar}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
        />

        {error ? (
          <Text testID="form-error" style={styles.error}>{error}</Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            testID="cancel-edit-profile"
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
            accessibilityRole="button"
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="save-edit-profile"
            onPress={onSave}
            style={[styles.button, styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
            accessibilityRole="button"
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  form: {
    padding: 16,
    gap: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.border,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  smallButtonText: {
    color: Colors.light.tint,
    fontWeight: '700',
    fontSize: 12,
  },
  libraryBtn: {},
  cameraBtn: {},
  label: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  error: {
    marginTop: 6,
    color: Colors.light.error,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
