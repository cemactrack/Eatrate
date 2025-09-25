import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, MoreVertical, Phone, Video, Image as ImageIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessaging } from '@/providers/MessagingProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationToast from '@/components/NotificationToast';
import type { Message } from '@/types/messaging';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onLongPress: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar, onLongPress }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <View style={styles.imageMessage}>
            <ImageIcon size={24} color={isOwn ? '#fff' : '#666'} />
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              Photo
            </Text>
          </View>
        );
      case 'location':
        return (
          <View style={styles.locationMessage}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              📍 {message.metadata?.location?.address || 'Location'}
            </Text>
          </View>
        );
      case 'restaurant_share':
        return (
          <View style={styles.restaurantMessage}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              🍽️ {message.metadata?.restaurantName || 'Restaurant'}
            </Text>
          </View>
        );
      default:
        return (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
      {!isOwn && showAvatar && (
        <View style={styles.messageAvatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
        onLongPress={onLongPress}
        testID={`message-${message.id}`}
      >
        {renderMessageContent()}
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && (
            <Text style={styles.messageStatus}>
              {message.isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

interface TypingIndicatorProps {
  isVisible: boolean;
  username?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, username }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>
          {username ? `${username} is typing...` : 'Typing...'}
        </Text>
      </View>
    </View>
  );
};

export default function ConversationScreen() {

  const insets = useSafeAreaInsets();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  
  const {
    conversations,
    messages,
    typingIndicators,
    isLoading,
    error,
    setActiveConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    setTyping,

    loadMoreMessages,
  } = useMessaging();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current conversation and messages
  const conversation = conversations.find(c => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const currentTypingIndicators = typingIndicators[conversationId] || [];

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
      
      // Mark messages as read when entering conversation
      if (conversationMessages.length > 0) {
        const unreadMessages = conversationMessages.filter(m => !m.isRead);
        if (unreadMessages.length > 0) {
          markAsRead(conversationId, unreadMessages.map(m => m.id)).catch(console.error);
        }
      }
    }

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation, markAsRead, conversationMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !conversation) return;

    // Use actual user ID from context - for now using mock ID
    const currentUserId = 'user1'; // In production, get from auth context
    const receiverId = conversation.participants.find(id => id !== currentUserId) || '';
    
    try {
      const messageContent = inputText.trim();
      setInputText('');
      
      await sendMessage({
        conversationId,
        receiverId,
        content: messageContent,
        type: 'text',
      });
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        await setTyping(conversationId, false);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      setToastMessage('Failed to send message');
      setShowToast(true);
    }
  }, [inputText, conversation, conversationId, sendMessage, isTyping, setTyping]);

  const handleInputChange = useCallback(async (text: string) => {
    // Input validation
    if (text.length > 1000) return;
    
    setInputText(text);
    
    // Handle typing indicator
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      await setTyping(conversationId, true);
    } else if (!text.trim() && isTyping) {
      setIsTyping(false);
      await setTyping(conversationId, false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (text.trim()) {
      typingTimeoutRef.current = setTimeout(async () => {
        setIsTyping(false);
        await setTyping(conversationId, false);
      }, 2000) as any;
    }
  }, [conversationId, isTyping, setTyping]);

  const handleMessageLongPress = useCallback((message: Message) => {
    // Use actual user ID from context - for now using mock ID
    const currentUserId = 'user1'; // In production, get from auth context
    // For now, just delete if it's the user's message
    if (message.senderId === currentUserId) {
      deleteMessage(message.id).catch(() => {
        setToastMessage('Failed to delete message');
        setShowToast(true);
      });
    }
  }, [deleteMessage]);

  const handleLoadMore = useCallback(() => {
    if (conversationMessages.length > 0) {
      loadMoreMessages(conversationId).catch(console.error);
    }
  }, [conversationId, conversationMessages.length, loadMoreMessages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Use actual user ID from context - for now using mock ID
    const currentUserId = 'user1'; // In production, get from auth context
    const isOwn = item.senderId === currentUserId;
    const previousMessage = index > 0 ? conversationMessages[index - 1] : null;
    const showAvatar = !isOwn && (!previousMessage || previousMessage.senderId !== item.senderId);

    return (
      <MessageItem
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onLongPress={() => handleMessageLongPress(item)}
      />
    );
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Conversation';
    
    if (conversation.type === 'restaurant_support' && conversation.restaurant) {
      return conversation.restaurant.name;
    }
    
    return conversation.otherParticipant?.displayName || 'Unknown User';
  };

  const getOnlineStatus = () => {
    if (conversation?.type === 'restaurant_support') return null;
    
    return conversation?.otherParticipant?.isOnline ? 'Online' : 
           conversation?.otherParticipant?.lastSeen ? 
           `Last seen ${conversation.otherParticipant.lastSeen.toLocaleTimeString()}` : null;
  };

  if (isLoading && conversationMessages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: getConversationTitle(),
            headerRight: () => (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton}>
                  <Phone size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton}>
                  <Video size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton}>
                  <MoreVertical size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Conversation' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: getConversationTitle(),

          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Phone size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Video size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <MoreVertical size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TypingIndicator
              isVisible={currentTypingIndicators.length > 0}
              username={currentTypingIndicators[0]?.username}
            />
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={() => {
                // TODO: Implement image/file attachment
                setToastMessage('Image attachments coming soon!');
                setShowToast(true);
              }}
            >
              <ImageIcon size={24} color="#666" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
              testID="message-input"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Send size={20} color={inputText.trim() ? '#fff' : '#ccc'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
    backgroundColor: '#f8f8f8',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorBanner: {
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  imageMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMessage: {
    minWidth: 120,
  },
  restaurantMessage: {
    minWidth: 120,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
});