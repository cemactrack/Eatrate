import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, MessageCircle, Building2 } from 'lucide-react-native';
import { useMessaging } from '@/providers/MessagingProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationToast from '@/components/NotificationToast';

interface ContactItemProps {
  id: string;
  name: string;
  type: 'user' | 'restaurant';
  avatar?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  onPress: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ id, name, type, isVerified, isOnline, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={onPress}
      testID={`contact-${id}`}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, type === 'restaurant' && styles.restaurantAvatar]}>
          {type === 'restaurant' ? (
            <Building2 size={24} color="#fff" />
          ) : (
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        {type === 'user' && isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      <View style={styles.contactContent}>
        <Text style={styles.contactName}>
          {name}
          {isVerified && <Text style={styles.verifiedBadge}> ✓</Text>}
        </Text>
        <Text style={styles.contactType}>
          {type === 'restaurant' ? 'Restaurant' : isOnline ? 'Online' : 'User'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function NewMessageScreen() {
  const router = useRouter();
  const { startConversation, isLoading } = useMessaging();

  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mock contacts data - In production, this would come from API
  const mockContacts = [
    { id: 'user1', name: 'John Doe', type: 'user' as const, isOnline: true },
    { id: 'user2', name: 'Jane Smith', type: 'user' as const, isOnline: false },
    { id: 'user3', name: 'Chef Mike', type: 'user' as const, isOnline: true },
    { id: 'rest1', name: 'Le Bistro', type: 'restaurant' as const, isVerified: true },
    { id: 'rest2', name: 'Pizza Palace', type: 'restaurant' as const, isVerified: false },
    { id: 'rest3', name: 'Sushi Master', type: 'restaurant' as const, isVerified: true },
    { id: 'rest4', name: 'Cameroon Delights', type: 'restaurant' as const, isVerified: true },
    { id: 'user4', name: 'Marie Dubois', type: 'user' as const, isOnline: false },
    { id: 'user5', name: 'Paul Ngozi', type: 'user' as const, isOnline: true },
  ];

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactPress = async (contact: typeof mockContacts[0]) => {
    try {
      const conversationId = await startConversation({
        participantId: contact.id,
        type: contact.type === 'restaurant' ? 'restaurant_support' : 'direct',
        initialMessage: `Hi ${contact.name}!`,
      });

      router.replace(`/messages/${conversationId}` as any);
    } catch (err) {
      setToastMessage('Failed to start conversation');
      setShowToast(true);
    }
  };

  const renderContactItem = ({ item }: { item: typeof mockContacts[0] }) => (
    <ContactItem
      id={item.id}
      name={item.name}
      type={item.type}
      isVerified={item.isVerified}
      isOnline={item.isOnline}
      onPress={() => handleContactPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No contacts found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Try searching for users or restaurants
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'New Message' }} />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'New Message' }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users and restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contacts</Text>
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        style={styles.contactsList}
        contentContainerStyle={filteredContacts.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <NotificationToast
        type="error"
        title={toastMessage}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantAvatar: {
    backgroundColor: '#FF6B35',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  verifiedBadge: {
    color: '#007AFF',
    fontSize: 14,
  },
  contactType: {
    fontSize: 14,
    color: '#666',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});