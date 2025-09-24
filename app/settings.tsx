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
import { useRouter } from 'expo-router';
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
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  showChevron = true 
}: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight size={20} color={Colors.light.secondary} />
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
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
              await logout();
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
  };

  const handleLocationToggle = (value: boolean) => {
    updateSettings({ locationEnabled: value });
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate EatRate',
      'Would you like to rate our app on the App Store?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rate Now', onPress: () => console.log('Opening App Store') },
      ]
    );
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
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at support@eatrate.com or visit our FAQ section.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We collect minimal data and never share your personal information.',
      [{ text: 'OK' }]
    );
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
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SettingSection title="Account">
          <View style={styles.userInfo}>
            <Text style={styles.userDisplayName}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={styles.userContact}>
              {user?.email || user?.phone || 'No contact info'}
            </Text>
          </View>
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell size={20} color={Colors.light.tint} />}
            title="Push Notifications"
            subtitle="Get notified about new reviews and updates"
            rightElement={
              <Switch
                value={settings.notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
                thumbColor={settings.notifications ? Colors.light.tint : Colors.light.secondary}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Moon size={20} color={Colors.light.tint} />}
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightElement={
              <Switch
                value={settings.darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
                thumbColor={settings.darkMode ? Colors.light.tint : Colors.light.secondary}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Globe size={20} color={Colors.light.tint} />}
            title="Location Services"
            subtitle="Help us find restaurants near you"
            rightElement={
              <Switch
                value={settings.locationEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
                thumbColor={settings.locationEnabled ? Colors.light.tint : Colors.light.secondary}
              />
            }
            showChevron={false}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon={<Star size={20} color={Colors.light.warning} />}
            title="Rate EatRate"
            subtitle="Love the app? Leave us a review"
            onPress={handleRateApp}
          />
          <SettingItem
            icon={<Share2 size={20} color={Colors.light.tint} />}
            title="Share EatRate"
            subtitle="Tell your friends about us"
            onPress={handleShareApp}
          />
          <SettingItem
            icon={<HelpCircle size={20} color={Colors.light.tint} />}
            title="Help & Support"
            subtitle="Get help or contact us"
            onPress={handleHelp}
          />
        </SettingSection>

        {/* Legal */}
        <SettingSection title="Legal">
          <SettingItem
            icon={<Shield size={20} color={Colors.light.tint} />}
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={handlePrivacy}
          />
          <SettingItem
            icon={<Camera size={20} color={Colors.light.tint} />}
            title="Photo Permissions"
            subtitle="Manage camera and photo library access"
            onPress={() => Alert.alert('Photo Permissions', 'Manage your photo permissions in device settings.')}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Account Management">
          <SettingItem
            icon={<Trash2 size={20} color={Colors.light.destructive} />}
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
          />
          <SettingItem
            icon={<LogOut size={20} color={Colors.light.destructive} />}
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: Colors.light.card,
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
    borderBottomColor: Colors.light.border,
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
    backgroundColor: Colors.light.accent,
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
    color: Colors.light.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.light.secondary,
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
    color: Colors.light.text,
  },
  userContact: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 32,
  },
});