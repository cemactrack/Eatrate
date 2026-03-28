import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Database,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { NotificationToast } from '@/components/NotificationToast';
import { useAdminActivityLogger } from '@/hooks/useAdminActivityLogger';
import Colors from '@/constants/colors';

export default function DatabaseManagementScreen() {
  const [importUrls, setImportUrls] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { logActivity } = useAdminActivityLogger();

  const { data: importedRestaurants, refetch: refetchImported, isLoading } = trpc.restaurants.getImportedOneTime.useQuery();
  const { data: needsImport } = trpc.restaurants.needsInitialImport.useQuery();

  const clearRestaurantsMutation = trpc.restaurants.clearRestaurants.useMutation({
    onSuccess: () => {
      setNotification({ message: 'All restaurants cleared successfully', type: 'success' });
      refetchImported();
      logActivity('restaurants_cleared', 'Cleared all restaurants from database');
    },
    onError: (error) => {
      setNotification({ message: error.message, type: 'error' });
    },
  });

  const importRestaurantsMutation = trpc.restaurants.importFromTripadvisor.useMutation({
    onSuccess: (data) => {
      setNotification({ message: `Successfully imported ${data.imported} restaurants`, type: 'success' });
      refetchImported();
      setImportUrls('');
      setIsImporting(false);
      logActivity('restaurants_imported', `Imported ${data.imported} restaurants from TripAdvisor`);
    },
    onError: (error) => {
      setNotification({ message: error.message, type: 'error' });
      setIsImporting(false);
    },
  });

  const bootstrapImportMutation = trpc.restaurants.bootstrapImport.useMutation({
    onSuccess: (data) => {
      setNotification({ message: data.message || 'Bootstrap import completed', type: 'success' });
      refetchImported();
      logActivity('restaurants_bootstrap', `Bootstrap import: ${data.imported} restaurants`);
    },
    onError: (error) => {
      setNotification({ message: error.message, type: 'error' });
    },
  });

  const handleClearAllRestaurants = () => {
    Alert.alert(
      'Clear All Restaurants',
      'Are you sure you want to delete ALL restaurants from the database? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearRestaurantsMutation.mutate();
          },
        },
      ]
    );
  };

  const handleImportRestaurants = () => {
    if (!importUrls.trim()) {
      setNotification({ message: 'Please enter at least one TripAdvisor URL', type: 'error' });
      return;
    }

    const urls = importUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setNotification({ message: 'Please enter valid TripAdvisor URLs', type: 'error' });
      return;
    }

    // Validate URLs
    const invalidUrls = urls.filter(url => !url.includes('tripadvisor.com'));
    if (invalidUrls.length > 0) {
      setNotification({ message: 'Please enter valid TripAdvisor URLs only', type: 'error' });
      return;
    }

    setIsImporting(true);
    importRestaurantsMutation.mutate({ urls, cityFallback: 'Cameroon' });
  };

  const handleBootstrapImport = () => {
    Alert.alert(
      'Bootstrap Import',
      'This will import restaurants from default TripAdvisor URLs for Cameroon cities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            bootstrapImportMutation.mutate();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Database Management' }} />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Database Management' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Database Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Database size={24} color={Colors.light.tint} />
              <Text style={styles.statValue}>{importedRestaurants?.restaurants?.length || 0}</Text>
              <Text style={styles.statLabel}>Total Restaurants</Text>
            </View>
            <View style={styles.statCard}>
              <RefreshCw size={24} color={needsImport?.needsImport ? '#f59e0b' : '#10b981'} />
              <Text style={styles.statValue}>{needsImport?.needsImport ? 'Empty' : 'Populated'}</Text>
              <Text style={styles.statLabel}>Database Status</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.dangerHeader}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          <Text style={styles.sectionDescription}>
            These actions are irreversible. Please proceed with caution.
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={handleClearAllRestaurants}
            disabled={clearRestaurantsMutation.isLoading}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {clearRestaurantsMutation.isLoading ? 'Clearing...' : 'Clear All Restaurants'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Restaurants</Text>
          <Text style={styles.sectionDescription}>
            Import restaurants from TripAdvisor by providing restaurant listing URLs.
          </Text>
          
          {/* Bootstrap Import */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Quick Import (Default Cities)</Text>
            <Text style={styles.subsectionDescription}>
              Import from default Cameroon cities: Douala, Yaoundé, Buea, and Limbe.
            </Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={handleBootstrapImport}
              disabled={bootstrapImportMutation.isLoading}
            >
              <Download size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {bootstrapImportMutation.isLoading ? 'Importing...' : 'Bootstrap Import'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Import */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Custom Import</Text>
            <Text style={styles.subsectionDescription}>
              Enter TripAdvisor restaurant listing URLs (one per line):
            </Text>
            
            <TextInput
              style={styles.importInput}
              value={importUrls}
              onChangeText={setImportUrls}
              placeholder={`https://www.tripadvisor.com/Restaurants-g293773-Douala_Littoral_Region.html\nhttps://www.tripadvisor.com/Restaurants-g293770-Yaounde_Centre_Region.html`}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={handleImportRestaurants}
              disabled={isImporting || importRestaurantsMutation.isLoading}
            >
              <Upload size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isImporting || importRestaurantsMutation.isLoading ? 'Importing...' : 'Import Restaurants'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Restaurants Preview */}
        {importedRestaurants?.restaurants && importedRestaurants.restaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Restaurants</Text>
            <Text style={styles.sectionDescription}>
              Preview of the last few imported restaurants:
            </Text>
            {importedRestaurants.restaurants.slice(0, 5).map((restaurant, index) => (
              <View key={restaurant.id} style={styles.restaurantPreview}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantDetails}>
                  {restaurant.cuisine} • {restaurant.rating}⭐ • {restaurant.address}
                </Text>
              </View>
            ))}
            {importedRestaurants.restaurants.length > 5 && (
              <Text style={styles.moreText}>
                ... and {importedRestaurants.restaurants.length - 5} more restaurants
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subsectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  importInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    minHeight: 120,
    fontFamily: 'monospace',
  },
  restaurantPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  restaurantDetails: {
    fontSize: 12,
    color: '#666',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});