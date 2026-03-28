import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Shield,
  Bell,
  Zap,
  Download,
  BarChart3,
  Save,
  RefreshCw,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function AdminSettingsScreen() {
  const [activeTab, setActiveTab] = useState<'platform' | 'moderation' | 'notifications' | 'features' | 'analytics'>('platform');
  const { hasPermission } = useAdmin();

  const settingsQuery = trpc.admin.settings.get.useQuery();
  const updateSettingsMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      const message = 'Settings updated successfully!';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
    },
  });

  const exportDataMutation = trpc.admin.settings.export.useMutation({
    onSuccess: (data) => {
      const message = `Export ready! Download URL: ${data.downloadUrl}`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Export Ready', message);
      }
    },
  });

  const [localSettings, setLocalSettings] = useState(settingsQuery.data);

  React.useEffect(() => {
    if (settingsQuery.data) {
      setLocalSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const handleSettingChange = (category: string, key: string, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category as keyof typeof localSettings],
        [key]: value,
      },
    });
  };

  const handleSaveSettings = () => {
    if (!hasPermission('manage_system')) {
      const message = 'You do not have permission to modify system settings.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Denied', message);
      }
      return;
    }

    if (localSettings) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const handleExportData = (type: 'users' | 'posts' | 'restaurants' | 'analytics') => {
    if (!hasPermission('view_analytics')) {
      const message = 'You do not have permission to export data.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Denied', message);
      }
      return;
    }

    exportDataMutation.mutate({
      type,
      format: 'csv',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    });
  };

  if (!hasPermission('manage_system') && !hasPermission('view_analytics')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermission}>
          <Settings size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noPermissionText}>
            You don&apos;t have permission to access admin settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const settings = localSettings || settingsQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        {[
          { key: 'platform', icon: Settings, label: 'Platform' },
          { key: 'moderation', icon: Shield, label: 'Moderation' },
          { key: 'notifications', icon: Bell, label: 'Notifications' },
          { key: 'features', icon: Zap, label: 'Features' },
          { key: 'analytics', icon: BarChart3, label: 'Analytics' },
        ].map(({ key, icon: Icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key as any)}
          >
            <Icon size={16} color={activeTab === key ? 'white' : Colors.light.tabIconDefault} />
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {activeTab === 'platform' && settings && (
            <View>
              <Text style={styles.sectionTitle}>Platform Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Maintenance Mode</Text>
                    <Text style={styles.settingDescription}>
                      Temporarily disable the platform for maintenance
                    </Text>
                  </View>
                  <Switch
                    value={settings.platform.maintenanceMode}
                    onValueChange={(value) => handleSettingChange('platform', 'maintenanceMode', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>User Registration</Text>
                    <Text style={styles.settingDescription}>
                      Allow new users to register accounts
                    </Text>
                  </View>
                  <Switch
                    value={settings.platform.registrationEnabled}
                    onValueChange={(value) => handleSettingChange('platform', 'registrationEnabled', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Posting Enabled</Text>
                    <Text style={styles.settingDescription}>
                      Allow users to create new posts
                    </Text>
                  </View>
                  <Switch
                    value={settings.platform.postingEnabled}
                    onValueChange={(value) => handleSettingChange('platform', 'postingEnabled', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Comments Enabled</Text>
                    <Text style={styles.settingDescription}>
                      Allow users to comment on posts
                    </Text>
                  </View>
                  <Switch
                    value={settings.platform.commentsEnabled}
                    onValueChange={(value) => handleSettingChange('platform', 'commentsEnabled', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>
            </View>
          )}

          {activeTab === 'moderation' && settings && (
            <View>
              <Text style={styles.sectionTitle}>Moderation Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Auto Moderation</Text>
                    <Text style={styles.settingDescription}>
                      Automatically flag potentially inappropriate content
                    </Text>
                  </View>
                  <Switch
                    value={settings.moderation.autoModeration}
                    onValueChange={(value) => handleSettingChange('moderation', 'autoModeration', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Require Approval</Text>
                    <Text style={styles.settingDescription}>
                      All posts require admin approval before publishing
                    </Text>
                  </View>
                  <Switch
                    value={settings.moderation.requireApproval}
                    onValueChange={(value) => handleSettingChange('moderation', 'requireApproval', value)}
                    trackColor={{ false: '#e5e7eb', true: Colors.light.tint }}
                    thumbColor="white"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <Text style={styles.settingLabel}>Flagged Content Threshold</Text>
                <Text style={styles.settingDescription}>
                  Number of reports needed to automatically flag content
                </Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.moderation.flaggedContentThreshold.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    handleSettingChange('moderation', 'flaggedContentThreshold', Math.max(1, Math.min(10, num)));
                  }}
                  keyboardType="numeric"
                  placeholder="3"
                />
              </View>
            </View>
          )}

          {activeTab === 'analytics' && (
            <View>
              <Text style={styles.sectionTitle}>Data Export</Text>
              
              <View style={styles.exportCard}>
                <Text style={styles.exportTitle}>Export User Data</Text>
                <Text style={styles.exportDescription}>
                  Download user accounts and activity data
                </Text>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExportData('users')}
                >
                  <Download size={16} color="white" />
                  <Text style={styles.exportButtonText}>Export Users</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exportCard}>
                <Text style={styles.exportTitle}>Export Posts Data</Text>
                <Text style={styles.exportDescription}>
                  Download all posts and engagement metrics
                </Text>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExportData('posts')}
                >
                  <Download size={16} color="white" />
                  <Text style={styles.exportButtonText}>Export Posts</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exportCard}>
                <Text style={styles.exportTitle}>Export Restaurant Data</Text>
                <Text style={styles.exportDescription}>
                  Download restaurant listings and reviews
                </Text>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExportData('restaurants')}
                >
                  <Download size={16} color="white" />
                  <Text style={styles.exportButtonText}>Export Restaurants</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exportCard}>
                <Text style={styles.exportTitle}>Export Analytics</Text>
                <Text style={styles.exportDescription}>
                  Download platform analytics and metrics
                </Text>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExportData('analytics')}
                >
                  <Download size={16} color="white" />
                  <Text style={styles.exportButtonText}>Export Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {hasPermission('manage_system') && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <RefreshCw size={16} color="white" />
            ) : (
              <Save size={16} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: 'center',
  },
  tabTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    lineHeight: 18,
  },
  numberInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
    width: 80,
  },
  exportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginBottom: 12,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 16,
  },
});