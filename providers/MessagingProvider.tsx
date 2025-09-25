import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import type { ConversationWithDetails, Message, TypingIndicator } from '@/types/messaging';

interface MessagingState {
  conversations: ConversationWithDetails[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  unreadCount: number;
  typingIndicators: Record<string, TypingIndicator[]>;
  isLoading: boolean;
  error: string | null;
}

interface MessagingActions {
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (params: {
    conversationId?: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'image' | 'location' | 'restaurant_share';
    metadata?: any;
  }) => Promise<void>;
  startConversation: (params: {
    participantId: string;
    type?: 'direct' | 'restaurant_support';
    initialMessage?: string;
  }) => Promise<string>;
  markAsRead: (conversationId: string, messageIds?: string[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  archiveConversation: (conversationId: string, archive: boolean) => Promise<void>;
  blockUser: (userId: string, block: boolean, reason?: string) => Promise<void>;
  reportMessage: (messageId: string, reason: string, description?: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  searchConversations: (query: string) => Promise<ConversationWithDetails[]>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
}

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const [state, setState] = useState<MessagingState>({
    conversations: [],
    activeConversationId: null,
    messages: {},
    unreadCount: 0,
    typingIndicators: {},
    isLoading: false,
    error: null,
  });

  const [messageOffsets, setMessageOffsets] = useState<Record<string, number>>({});

  // Queries
  const conversationsQuery = trpc.messaging.getConversations.useQuery({
    limit: 50,
    offset: 0,
    type: 'all',
  });

  const unreadCountQuery = trpc.messaging.getUnreadCount.useQuery();

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();
  const startConversationMutation = trpc.messaging.startConversation.useMutation();
  const markAsReadMutation = trpc.messaging.markAsRead.useMutation();
  const deleteMessageMutation = trpc.messaging.deleteMessage.useMutation();
  const archiveConversationMutation = trpc.messaging.archiveConversation.useMutation();
  const blockUserMutation = trpc.messaging.blockUser.useMutation();
  const reportMessageMutation = trpc.messaging.reportMessage.useMutation();
  const addReactionMutation = trpc.messaging.addReaction.useMutation();
  const removeReactionMutation = trpc.messaging.removeReaction.useMutation();
  const setTypingMutation = trpc.messaging.setTyping.useMutation();


  // Update state when queries complete
  useEffect(() => {
    if (conversationsQuery.data) {
      setState(prev => ({
        ...prev,
        conversations: conversationsQuery.data.conversations,
        isLoading: false,
        error: null,
      }));
    }
  }, [conversationsQuery.data]);

  useEffect(() => {
    if (unreadCountQuery.data) {
      setState(prev => ({
        ...prev,
        unreadCount: unreadCountQuery.data.unreadCount,
      }));
    }
  }, [unreadCountQuery.data]);

  useEffect(() => {
    if (conversationsQuery.error) {
      setState(prev => ({
        ...prev,
        error: conversationsQuery.error?.message || 'Failed to load conversations',
        isLoading: false,
      }));
    }
  }, [conversationsQuery.error]);

  // Load messages for active conversation
  const messagesQuery = trpc.messaging.getMessages.useQuery(
    {
      conversationId: state.activeConversationId!,
      limit: 50,
      offset: messageOffsets[state.activeConversationId!] || 0,
    },
    {
      enabled: !!state.activeConversationId,
    }
  );

  useEffect(() => {
    if (messagesQuery.data && state.activeConversationId) {
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [state.activeConversationId!]: messagesQuery.data.messages,
        },
      }));
    }
  }, [messagesQuery.data, state.activeConversationId]);

  // Load typing indicators for active conversation
  const typingQuery = trpc.messaging.getTypingIndicators.useQuery(
    {
      conversationId: state.activeConversationId!,
    },
    {
      enabled: !!state.activeConversationId,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  );

  useEffect(() => {
    if (typingQuery.data && state.activeConversationId) {
      setState(prev => ({
        ...prev,
        typingIndicators: {
          ...prev.typingIndicators,
          [state.activeConversationId!]: typingQuery.data,
        },
      }));
    }
  }, [typingQuery.data, state.activeConversationId]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    setState(prev => ({
      ...prev,
      activeConversationId: conversationId,
    }));
  }, []);

  const sendMessage = useCallback(async (params: {
    conversationId?: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'image' | 'location' | 'restaurant_share';
    metadata?: any;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await sendMessageMutation.mutateAsync(params);
      
      // Update local state with new message
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [result.conversationId]: [
            ...(prev.messages[result.conversationId] || []),
            result.message,
          ],
        },
        isLoading: false,
      }));

      // Refresh conversations to update last message
      await conversationsQuery.refetch();
      await unreadCountQuery.refetch();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to send message',
        isLoading: false,
      }));
      throw error;
    }
  }, [sendMessageMutation, conversationsQuery, unreadCountQuery]);

  const startConversation = useCallback(async (params: {
    participantId: string;
    type?: 'direct' | 'restaurant_support';
    initialMessage?: string;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await startConversationMutation.mutateAsync(params);
      
      // Refresh conversations
      await conversationsQuery.refetch();
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return result.conversationId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start conversation',
        isLoading: false,
      }));
      throw error;
    }
  }, [startConversationMutation, conversationsQuery]);

  const markAsRead = useCallback(async (conversationId: string, messageIds?: string[]) => {
    try {
      await markAsReadMutation.mutateAsync({ conversationId, messageIds });
      
      // Update local state
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: prev.messages[conversationId]?.map(msg => 
            !messageIds || messageIds.includes(msg.id) 
              ? { ...msg, isRead: true }
              : msg
          ) || [],
        },
      }));

      // Refresh conversations and unread count
      await conversationsQuery.refetch();
      await unreadCountQuery.refetch();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to mark messages as read',
      }));
      throw error;
    }
  }, [markAsReadMutation, conversationsQuery, unreadCountQuery]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync({ messageId });
      
      // Remove message from local state
      setState(prev => ({
        ...prev,
        messages: Object.fromEntries(
          Object.entries(prev.messages).map(([convId, messages]) => [
            convId,
            messages.filter(msg => msg.id !== messageId),
          ])
        ),
      }));

      // Refresh conversations
      await conversationsQuery.refetch();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to delete message',
      }));
      throw error;
    }
  }, [deleteMessageMutation, conversationsQuery]);

  const archiveConversation = useCallback(async (conversationId: string, archive: boolean) => {
    try {
      await archiveConversationMutation.mutateAsync({ conversationId, archive });
      
      // Refresh conversations
      await conversationsQuery.refetch();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to archive conversation',
      }));
      throw error;
    }
  }, [archiveConversationMutation, conversationsQuery]);

  const blockUser = useCallback(async (userId: string, block: boolean, reason?: string) => {
    try {
      await blockUserMutation.mutateAsync({ userId, block, reason });
      
      // Refresh conversations
      await conversationsQuery.refetch();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to block/unblock user',
      }));
      throw error;
    }
  }, [blockUserMutation, conversationsQuery]);

  const reportMessage = useCallback(async (messageId: string, reason: string, description?: string) => {
    try {
      await reportMessageMutation.mutateAsync({ 
        messageId, 
        reason: reason as any, 
        description 
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to report message',
      }));
      throw error;
    }
  }, [reportMessageMutation]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReactionMutation.mutateAsync({ messageId, emoji });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to add reaction',
      }));
      throw error;
    }
  }, [addReactionMutation]);

  const removeReaction = useCallback(async (messageId: string) => {
    try {
      await removeReactionMutation.mutateAsync({ messageId });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to remove reaction',
      }));
      throw error;
    }
  }, [removeReactionMutation]);

  const setTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    try {
      await setTypingMutation.mutateAsync({ conversationId, isTyping });
    } catch (error: any) {
      console.error('Failed to set typing indicator:', error);
    }
  }, [setTypingMutation]);

  const searchConversations = useCallback(async (query: string) => {
    try {
      // For now, we'll filter locally. In a real app, this would be a server query
      const filtered = state.conversations.filter(conv => {
        const otherParticipant = conv.otherParticipant;
        const restaurant = conv.restaurant;
        const lastMessage = conv.lastMessage;
        
        return (
          lastMessage?.content.toLowerCase().includes(query.toLowerCase()) ||
          otherParticipant?.displayName.toLowerCase().includes(query.toLowerCase()) ||
          otherParticipant?.username.toLowerCase().includes(query.toLowerCase()) ||
          restaurant?.name.toLowerCase().includes(query.toLowerCase())
        );
      });
      
      return filtered;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to search conversations',
      }));
      throw error;
    }
  }, [state.conversations]);

  const refreshConversations = useCallback(async () => {
    await conversationsQuery.refetch();
    await unreadCountQuery.refetch();
  }, [conversationsQuery, unreadCountQuery]);

  const refreshMessages = useCallback(async (conversationId: string) => {
    if (conversationId === state.activeConversationId) {
      await messagesQuery.refetch();
    }
  }, [messagesQuery, state.activeConversationId]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    const currentOffset = messageOffsets[conversationId] || 0;
    
    setMessageOffsets(prev => ({
      ...prev,
      [conversationId]: currentOffset + 50,
    }));

    // This will trigger a refetch with the new offset
    if (conversationId === state.activeConversationId) {
      await messagesQuery.refetch();
    }
  }, [messageOffsets, state.activeConversationId, messagesQuery]);

  return useMemo(() => ({
    ...state,
    setActiveConversation,
    sendMessage,
    startConversation,
    markAsRead,
    deleteMessage,
    archiveConversation,
    blockUser,
    reportMessage,
    addReaction,
    removeReaction,
    setTyping,
    searchConversations,
    refreshConversations,
    refreshMessages,
    loadMoreMessages,
  }), [
    state,
    setActiveConversation,
    sendMessage,
    startConversation,
    markAsRead,
    deleteMessage,
    archiveConversation,
    blockUser,
    reportMessage,
    addReaction,
    removeReaction,
    setTyping,
    searchConversations,
    refreshConversations,
    refreshMessages,
    loadMoreMessages,
  ]);
});