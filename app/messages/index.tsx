import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, Search, Plus } from 'lucide-react-native';
import { useMessaging } from '@/providers/MessagingProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationToast from '@/components/NotificationToast';
import type { ConversationWithDetails } from '@/types/messaging';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  onPress: () => void;
  onLongPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress, onLongPress }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getDisplayName = () => {
    if (conversation.type === 'restaurant_support' && conversation.restaurant) {
      return conversation.restaurant.name;
    }
    return conversation.otherParticipant?.displayName || 'Unknown User';
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type } = conversation.lastMessage;
    switch (type) {
      case 'image':
        return '📷 Photo';
      case 'location':
        return '📍 Location';
      case 'restaurant_share':
        return '🍽️ Restaurant';
      default:
        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    }
  };

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`conversation-${conversation.id}`}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getDisplayName().charAt(0).toUpperCase()}
          </Text>
        </View>
        {conversation.otherParticipant?.isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.displayName} numberOfLines={1}>
            {getDisplayName()}
            {conversation.type === 'restaurant_support' && conversation.restaurant?.isVerified && (
              <Text style={styles.verifiedBadge}> ✓</Text>
            )}
          </Text>
          <Text style={styles.timestamp}>
            {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.lastMessage,
              conversation.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MessagingScreen() {
  const router = useRouter();
  const {
    conversations,
    unreadCount,
    isLoading,
    error,
    refreshConversations,
    archiveConversation,
    searchConversations,
  } = useMessaging();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (searchQuery.trim()) {
      searchConversations(searchQuery)
        .then(setFilteredConversations)
        .catch(console.error);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations, searchConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConversationPress = (conversation: ConversationWithDetails) => {
    router.push(`/messages/${conversation.id}` as any);
  };

  const handleConversationLongPress = (conversation: ConversationWithDetails) => {
    // For now, just archive directly. In a real app, use a modal
    handleArchiveConversation(conversation.id);
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId, true);
      setToastMessage('Conversation archived');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to archive conversation');
      setShowToast(true);
    }
  };

  const handleNewMessage = () => {
    router.push('/messages/new' as any);
  };

  const renderConversationItem = ({ item }: { item: ConversationWithDetails }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
      onLongPress={() => handleConversationLongPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start a conversation with other users or restaurants
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={handleNewMessage}>
        <Plus size={20} color="#fff" />
        <Text style={styles.startButtonText}>Start Messaging</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Messages',
            headerRight: () => (
              <TouchableOpacity onPress={handleNewMessage}>
                <Plus size={24} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleNewMessage} style={styles.headerButton}>
                <Plus size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}

        showsVerticalScrollIndicator={false}
      />

      <NotificationToast
        type="info"
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
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
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  verifiedBadge: {
    color: '#007AFF',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});