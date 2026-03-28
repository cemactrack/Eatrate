import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Image, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, MapPin, Tag, Globe, Lock } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const initialDisplayName = useMemo<string>(() => user?.displayName ?? '', [user?.displayName]);
  const initialAvatar = useMemo<string>(() => user?.avatar ?? '', [user?.avatar]);

  const [displayName, setDisplayName] = useState<string>(initialDisplayName);
  const [avatar, setAvatar] = useState<string>(initialAvatar);
  const [bio, setBio] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [cuisines, setCuisines] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [socialMedia, setSocialMedia] = useState<string>('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [allowMessages, setAllowMessages] = useState<boolean>(true);
  const [showEmail, setShowEmail] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [picking, setPicking] = useState<boolean>(false);

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = trpc.users.getProfile.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  const updateProfileMutation = trpc.users.updateProfile.useMutation();

  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio ?? '');
      setCity(userProfile.location?.city ?? '');
      setCountry(userProfile.location?.country ?? '');
      setCuisines(userProfile.preferences.cuisines.join(', '));
      setDietaryRestrictions(userProfile.preferences.dietaryRestrictions.join(', '));
      setPriceRange(userProfile.preferences.priceRange.join(', '));
      setWebsite((userProfile as any).website || '');
      setSocialMedia((userProfile as any).socialMedia || '');
      setProfileVisibility((userProfile as any).privacy?.profileVisibility || 'public');
      setAllowMessages((userProfile as any).privacy?.allowMessages ?? true);
      setShowEmail((userProfile as any).privacy?.showEmail ?? false);
    }
  }, [userProfile]);

  const onCancel = useCallback(() => {
    console.log('[EditProfile] Cancel pressed');
    router.back();
  }, [router]);

  const validate = useCallback((): string | null => {
    const name = displayName?.trim() ?? '';
    if (!name) return 'Display name is required';
    if (name.length > 50) return 'Display name must be under 50 characters';
    if (bio.length > 500) return 'Bio must be under 500 characters';
    if (city.length > 100) return 'City name must be under 100 characters';
    if (country.length > 100) return 'Country name must be under 100 characters';
    if (avatar?.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        return 'Avatar must be a valid URL';
      }
    }
    return null;
  }, [displayName, avatar, bio, city, country]);

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
      // Update auth profile
      await updateProfile({ displayName: displayName.trim(), avatar: avatar.trim() || undefined });
      
      // Update extended profile
      const profileData: any = {};
      if (bio.trim()) profileData.bio = bio.trim();
      if (city.trim() && country.trim()) {
        profileData.location = { city: city.trim(), country: country.trim() };
      }
      if (cuisines.trim() || dietaryRestrictions.trim() || priceRange.trim()) {
        profileData.preferences = {
          cuisines: cuisines.split(',').map(c => c.trim()).filter(Boolean),
          dietaryRestrictions: dietaryRestrictions.split(',').map(d => d.trim()).filter(Boolean),
          priceRange: priceRange.split(',').map(p => p.trim()).filter(Boolean)
        };
      }
      
      if (website.trim()) profileData.website = website.trim();
      if (socialMedia.trim()) profileData.socialMedia = socialMedia.trim();
      
      profileData.privacy = {
        profileVisibility,
        allowMessages,
        showEmail
      };
      
      if (Object.keys(profileData).length > 0) {
        await updateProfileMutation.mutateAsync(profileData);
      }
      
      console.log('[EditProfile] Profile updated');
      router.back();
    } catch (e) {
      console.error('[EditProfile] update error', e);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [avatar, displayName, bio, city, country, cuisines, dietaryRestrictions, priceRange, website, socialMedia, profileVisibility, allowMessages, showEmail, router, updateProfile, updateProfileMutation, validate]);

  if (profileLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ title: 'Edit Profile' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }] }>
      <Stack.Screen options={{ title: 'Edit Profile' }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.label}>Bio</Text>
        <TextInput
          testID="bio-input"
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself and your food preferences..."
          placeholderTextColor={Colors.light.secondary}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>

        <View style={styles.sectionHeader}>
          <MapPin size={16} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        
        <Text style={styles.label}>City</Text>
        <TextInput
          testID="city-input"
          style={styles.input}
          placeholder="Your city"
          placeholderTextColor={Colors.light.secondary}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
          maxLength={100}
        />
        
        <Text style={styles.label}>Country</Text>
        <TextInput
          testID="country-input"
          style={styles.input}
          placeholder="Your country"
          placeholderTextColor={Colors.light.secondary}
          value={country}
          onChangeText={setCountry}
          autoCapitalize="words"
          maxLength={100}
        />

        <View style={styles.sectionHeader}>
          <Tag size={16} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Food Preferences</Text>
        </View>
        
        <Text style={styles.label}>Favorite Cuisines</Text>
        <TextInput
          testID="cuisines-input"
          style={styles.input}
          placeholder="Italian, Asian, Local, etc. (comma separated)"
          placeholderTextColor={Colors.light.secondary}
          value={cuisines}
          onChangeText={setCuisines}
          autoCapitalize="words"
        />
        
        <Text style={styles.label}>Dietary Restrictions</Text>
        <TextInput
          testID="dietary-input"
          style={styles.input}
          placeholder="Vegetarian, Vegan, Gluten-free, etc. (comma separated)"
          placeholderTextColor={Colors.light.secondary}
          value={dietaryRestrictions}
          onChangeText={setDietaryRestrictions}
          autoCapitalize="words"
        />
        
        <Text style={styles.label}>Price Range Preference</Text>
        <TextInput
          testID="price-range-input"
          style={styles.input}
          placeholder="$, $, $, $ (comma separated)"
          placeholderTextColor={Colors.light.secondary}
          value={priceRange}
          onChangeText={setPriceRange}
        />

        <View style={styles.sectionHeader}>
          <Globe size={16} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Social & Contact</Text>
        </View>
        
        <Text style={styles.label}>Website</Text>
        <TextInput
          testID="website-input"
          style={styles.input}
          placeholder="https://yourwebsite.com"
          placeholderTextColor={Colors.light.secondary}
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
          keyboardType="url"
        />
        
        <Text style={styles.label}>Social Media</Text>
        <TextInput
          testID="social-media-input"
          style={styles.input}
          placeholder="@username or social media links"
          placeholderTextColor={Colors.light.secondary}
          value={socialMedia}
          onChangeText={setSocialMedia}
          autoCapitalize="none"
        />

        <View style={styles.sectionHeader}>
          <Lock size={16} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
        </View>
        
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Profile Visibility</Text>
          <View style={styles.privacyButtons}>
            <TouchableOpacity
              style={[styles.privacyButton, profileVisibility === 'public' && styles.privacyButtonActive]}
              onPress={() => setProfileVisibility('public')}
            >
              <Text style={[styles.privacyButtonText, profileVisibility === 'public' && styles.privacyButtonTextActive]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.privacyButton, profileVisibility === 'private' && styles.privacyButtonActive]}
              onPress={() => setProfileVisibility('private')}
            >
              <Text style={[styles.privacyButtonText, profileVisibility === 'private' && styles.privacyButtonTextActive]}>Private</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Allow Messages</Text>
          <TouchableOpacity
            style={[styles.toggleButton, allowMessages && styles.toggleButtonActive]}
            onPress={() => setAllowMessages(!allowMessages)}
          >
            <View style={[styles.toggleIndicator, allowMessages && styles.toggleIndicatorActive]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Show Email Publicly</Text>
          <TouchableOpacity
            style={[styles.toggleButton, showEmail && styles.toggleButtonActive]}
            onPress={() => setShowEmail(!showEmail)}
          >
            <View style={[styles.toggleIndicator, showEmail && styles.toggleIndicatorActive]} />
          </TouchableOpacity>
        </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.secondary,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.secondary,
    textAlign: 'right',
    marginTop: -5,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
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
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  privacyLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  privacyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  privacyButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  privacyButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  privacyButtonTextActive: {
    color: 'white',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
});
