import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';
import NotificationToast, { ToastType } from '@/components/NotificationToast';

export default function StatusComposerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [text, setText] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ visible: boolean; type: ToastType; title: string; message?: string }>({
    visible: false,
    type: 'info',
    title: '',
  });

  const createStatus = trpc.status.create.useMutation();

  const pickFromLibrary = useCallback(async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setImage(objectUrl);
      };
      input.click();
      return;
    }
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
      setImage(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Camera capture is not supported on web in this flow. Pick from library instead.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  }, []);

  const onSubmit = useCallback(async () => {
    if (!text.trim() && !image) {
      Alert.alert('Empty status', 'Add text or an image.');
      return;
    }
    setSubmitting(true);
    try {
      await createStatus.mutateAsync({ text: text.trim() || undefined, image: image || undefined });
      setToast({ visible: true, type: 'success', title: 'Status posted', message: 'Your status is live.' });
      setText('');
      setImage('');
      setTimeout(() => router.back(), 500);
    } catch (e) {
      setToast({ visible: true, type: 'error', title: 'Failed to post', message: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [createStatus, image, router, text]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <Stack.Screen options={{ title: 'Post Status' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.textBox}>
          <TextInput
            testID="status-text-input"
            style={styles.input}
            placeholder="Share something..."
            placeholderTextColor={Colors.light.secondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={240}
          />
          <Text style={styles.counter}>{text.length}/240</Text>
        </View>

        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity testID="remove-status-image" onPress={() => setImage('')} style={styles.removeBtn}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity testID="pick-status-library" onPress={pickFromLibrary} style={styles.actionChip}>
            <ImageIcon size={18} color={Colors.light.tint} />
            <Text style={styles.actionText}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="pick-status-camera" onPress={takePhoto} style={styles.actionChip}>
            <Camera size={18} color={Colors.light.tint} />
            <Text style={styles.actionText}>Camera</Text>
          </TouchableOpacity>
          <View style={styles.flex1} />
          <TouchableOpacity
            testID="submit-status"
            onPress={onSubmit}
            disabled={submitting || (!text.trim() && !image)}
            style={[styles.postBtn, (submitting || (!text.trim() && !image)) && styles.postBtnDisabled]}
          >
            <Text style={styles.postBtnText}>{submitting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NotificationToast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: 16,
  },
  textBox: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 12,
  },
  input: {
    minHeight: 100,
    fontSize: 16,
    color: Colors.light.text,
    textAlignVertical: 'top',
  },
  counter: {
    marginTop: 8,
    textAlign: 'right',
    color: Colors.light.secondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  actionText: {
    marginLeft: 6,
    color: Colors.light.tint,
    fontWeight: '700',
    fontSize: 12,
  },
  postBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  postBtnDisabled: {
    backgroundColor: Colors.light.border,
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  previewWrap: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: { flex: 1 },
});
