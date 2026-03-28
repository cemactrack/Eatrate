import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  Shield,
  HelpCircle,
  Star,
  Share2,
  LogOut,
  Moon,
  Globe,
  Camera,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';
import * as Linking from 'expo-linking';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  chevronColor?: string;
}

function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  showChevron = true,
  chevronColor,
}: SettingItemProps) {
  const { colors } = useSettings();
  return (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={onPress} testID={`setting-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.secondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight size={20} color={chevronColor ?? colors.secondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  const { colors } = useSettings();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.secondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { user, signOut } = authContext || { user: null, signOut: async () => {} };
  const { settings, updateSettings, colors, setTheme } = useSettings();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleNotificationToggle = (value: boolean) => {
    updateSettings({ notifications: value });
  };

  const handleDarkModeToggle = (value: boolean) => {
    updateSettings({ darkMode: value });
    setTheme(value ? 'dark' : 'light');
  };

  const handleLocationToggle = (value: boolean) => {
    updateSettings({ locationEnabled: value });
  };

  const handleRateApp = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out EatRate - the best food review app! Download it now.',
        url: 'https://eatrate.app',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleHelp = () => {
    router.push('/help');
  };

  const handlePrivacy = () => {
    router.push('/privacy');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]} testID="settings-screen">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} testID="settings-scroll">
        {/* Account Section */}
        <SettingSection title="Account">
          <View style={styles.userInfo}>
            <Text style={[styles.userDisplayName, { color: colors.text }]}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={[styles.userContact, { color: colors.secondary }]}>
              {user?.email || 'No contact info'}
            </Text>
          </View>
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell size={20} color={colors.tint} />}
            title="Push Notifications"
            subtitle="Get notified about new reviews and updates"
            rightElement={
              <Switch
                value={settings.notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={settings.notifications ? colors.tint : colors.secondary}
                testID="toggle-notifications"
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Moon size={20} color={colors.tint} />}
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightElement={
              <Switch
                value={settings.darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={settings.darkMode ? colors.tint : colors.secondary}
                testID="toggle-dark-mode"
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Globe size={20} color={colors.tint} />}
            title="Location Services"
            subtitle="Help us find restaurants near you"
            rightElement={
              <Switch
                value={settings.locationEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={settings.locationEnabled ? colors.tint : colors.secondary}
                testID="toggle-location"
              />
            }
            showChevron={false}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon={<Star size={20} color={colors.warning} />}
            title="Rate EatRate"
            subtitle="Love the app? Leave us a review"
            onPress={handleRateApp}
            chevronColor={colors.secondary}
          />
          <SettingItem
            icon={<Share2 size={20} color={colors.tint} />}
            title="Share EatRate"
            subtitle="Tell your friends about us"
            onPress={handleShareApp}
            chevronColor={colors.secondary}
          />
          <SettingItem
            icon={<HelpCircle size={20} color={colors.tint} />}
            title="Help & Support"
            subtitle="Get help or contact us"
            onPress={handleHelp}
            chevronColor={colors.secondary}
          />
        </SettingSection>

        {/* Legal */}
        <SettingSection title="Legal">
          <SettingItem
            icon={<Shield size={20} color={colors.tint} />}
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={handlePrivacy}
            chevronColor={colors.secondary}
          />
          <SettingItem
            icon={<Camera size={20} color={colors.tint} />}
            title="Photo Permissions"
            subtitle="Manage camera and photo library access"
            onPress={() => Linking.openSettings()}
            chevronColor={colors.secondary}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Account Management">
          <SettingItem
            icon={<Trash2 size={20} color={colors.destructive} />}
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            chevronColor={colors.secondary}
          />
          <SettingItem
            icon={<LogOut size={20} color={colors.destructive} />}
            title={isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showChevron={false}
          />
        </SettingSection>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userContact: {
    fontSize: 14,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 32,
  },
});