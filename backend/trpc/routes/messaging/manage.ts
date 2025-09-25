import { z } from 'zod';
import { protectedProcedure } from '../../create-context';
import { TRPCError } from '@trpc/server';
import type { Message, Conversation, ConversationWithDetails, MessageReaction, BlockedUser, MessageReport } from '@/types/messaging';

// Mock data stores
const messages: Message[] = [];
const conversations: Conversation[] = [];
const messageReactions: MessageReaction[] = [];
const blockedUsers: BlockedUser[] = [];
const messageReports: MessageReport[] = [];
const onlineUsers = new Set<string>();
const typingUsers = new Map<string, Set<string>>();

// Mock user data - In production, this would come from a real database
const mockUsers: MockUser[] = [
  { id: 'user1', username: 'john_doe', displayName: 'John Doe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', email: 'john@example.com', isOnline: true, lastSeen: new Date() },
  { id: 'user2', username: 'jane_smith', displayName: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', email: 'jane@example.com', isOnline: false, lastSeen: new Date(Date.now() - 300000) },
  { id: 'user3', username: 'chef_mike', displayName: 'Chef Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', email: 'chef@example.com', isOnline: true, lastSeen: new Date() },
];

interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  email: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface MockRestaurant {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

const mockRestaurants: MockRestaurant[] = [
  { id: 'rest1', name: 'Le Bistro', avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&h=150&fit=crop', isVerified: true },
  { id: 'rest2', name: 'Pizza Palace', avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&h=150&fit=crop', isVerified: false },
];

// Get conversations for current user
export const getConversations = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
    type: z.enum(['all', 'direct', 'restaurant_support']).default('all'),
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    let filteredConversations = conversations.filter(conv => 
      conv.participants.includes(userId) && !conv.isArchived
    );

    if (input.type !== 'all') {
      filteredConversations = filteredConversations.filter(conv => conv.type === input.type);
    }

    // Sort by last activity
    filteredConversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Apply pagination
    const paginatedConversations = filteredConversations.slice(input.offset, input.offset + input.limit);

    // Add participant details
    const conversationsWithDetails: ConversationWithDetails[] = paginatedConversations.map(conv => {
      const otherParticipantId = conv.participants.find(id => id !== userId);
      let otherParticipant;
      let restaurant;

      if (conv.type === 'direct' && otherParticipantId) {
        const user = mockUsers.find((u: MockUser) => u.id === otherParticipantId);
        if (user) {
          otherParticipant = {
            ...user,
            isOnline: onlineUsers.has(otherParticipantId),
            lastSeen: new Date(Date.now() - Math.random() * 3600000), // Random last seen within last hour
          };
        }
      } else if (conv.type === 'restaurant_support' && otherParticipantId) {
        restaurant = mockRestaurants.find((r: MockRestaurant) => r.id === otherParticipantId);
      }

      return {
        ...conv,
        otherParticipant,
        restaurant,
      };
    });

    return {
      conversations: conversationsWithDetails,
      hasMore: input.offset + input.limit < filteredConversations.length,
      total: filteredConversations.length,
    };
  });

// Get messages for a conversation
export const getMessages = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    // Check if user is participant in conversation
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found or access denied',
      });
    }

    // Get messages for conversation
    const conversationMessages = messages
      .filter(m => m.conversationId === input.conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(input.offset, input.offset + input.limit);

    // Mark messages as read
    conversationMessages.forEach(message => {
      if (message.receiverId === userId && !message.isRead) {
        message.isRead = true;
        message.updatedAt = new Date();
      }
    });

    // Update unread count
    conversation.unreadCount = Math.max(0, conversation.unreadCount - conversationMessages.filter(m => m.receiverId === userId).length);

    return {
      messages: conversationMessages.reverse(), // Return in chronological order
      hasMore: input.offset + input.limit < messages.filter(m => m.conversationId === input.conversationId).length,
    };
  });

// Send a message
export const sendMessage = protectedProcedure
  .input(z.object({
    conversationId: z.string().optional(),
    receiverId: z.string(),
    content: z.string().min(1).max(1000),
    type: z.enum(['text', 'image', 'location', 'restaurant_share']).default('text'),
    metadata: z.object({
      imageUrl: z.string().url().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
      }).optional(),
      restaurantId: z.string().optional(),
      restaurantName: z.string().optional(),
    }).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    // Check if receiver is blocked
    const isBlocked = blockedUsers.some(block => 
      (block.userId === userId && block.blockedUserId === input.receiverId) ||
      (block.userId === input.receiverId && block.blockedUserId === userId)
    );
    
    if (isBlocked) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot send message to this user',
      });
    }

    let conversation: Conversation;
    
    if (input.conversationId) {
      // Use existing conversation
      const existingConv = conversations.find(c => 
        c.id === input.conversationId && c.participants.includes(userId)
      );
      
      if (!existingConv) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }
      
      conversation = existingConv;
    } else {
      // Create new conversation
      const existingConv = conversations.find(c => 
        c.participants.includes(userId) && 
        c.participants.includes(input.receiverId) &&
        c.participants.length === 2
      );
      
      if (existingConv) {
        conversation = existingConv;
      } else {
        const newConversation: Conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          participants: [userId, input.receiverId],
          type: mockRestaurants.some(r => r.id === input.receiverId) ? 'restaurant_support' : 'direct',
          lastActivity: new Date(),
          unreadCount: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        conversations.push(newConversation);
        conversation = newConversation;
      }
    }

    // Create message
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId: conversation.id,
      senderId: userId,
      receiverId: input.receiverId,
      content: input.content,
      type: input.type,
      metadata: input.metadata,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    messages.push(message);

    // Update conversation
    conversation.lastMessage = message;
    conversation.lastActivity = new Date();
    conversation.updatedAt = new Date();
    
    // Increment unread count for receiver
    conversation.unreadCount += 1;

    return {
      message,
      conversationId: conversation.id,
    };
  });

// Start a conversation with a user or restaurant
export const startConversation = protectedProcedure
  .input(z.object({
    participantId: z.string(),
    type: z.enum(['direct', 'restaurant_support']).default('direct'),
    initialMessage: z.string().min(1).max(1000).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    if (userId === input.participantId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot start conversation with yourself',
      });
    }

    // Check if conversation already exists
    const existingConv = conversations.find(c => 
      c.participants.includes(userId) && 
      c.participants.includes(input.participantId) &&
      c.participants.length === 2
    );
    
    if (existingConv) {
      return { conversationId: existingConv.id, isNew: false };
    }

    // Create new conversation
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [userId, input.participantId],
      type: input.type,
      lastActivity: new Date(),
      unreadCount: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    conversations.push(conversation);

    // Send initial message if provided
    if (input.initialMessage) {
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: conversation.id,
        senderId: userId,
        receiverId: input.participantId,
        content: input.initialMessage,
        type: 'text',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      messages.push(message);
      conversation.lastMessage = message;
      conversation.unreadCount = 1;
    }

    return { conversationId: conversation.id, isNew: true };
  });

// Mark messages as read
export const markAsRead = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
    messageIds: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    let messagesToMark = messages.filter(m => 
      m.conversationId === input.conversationId && 
      m.receiverId === userId && 
      !m.isRead
    );

    if (input.messageIds) {
      messagesToMark = messagesToMark.filter(m => input.messageIds!.includes(m.id));
    }

    messagesToMark.forEach(message => {
      message.isRead = true;
      message.updatedAt = new Date();
    });

    // Update conversation unread count
    conversation.unreadCount = Math.max(0, conversation.unreadCount - messagesToMark.length);

    return { markedCount: messagesToMark.length };
  });

// Delete a message
export const deleteMessage = protectedProcedure
  .input(z.object({
    messageId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const messageIndex = messages.findIndex(m => 
      m.id === input.messageId && m.senderId === userId
    );
    
    if (messageIndex === -1) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found or access denied',
      });
    }

    messages.splice(messageIndex, 1);

    return { success: true };
  });

// Archive/unarchive conversation
export const archiveConversation = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
    archive: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    conversation.isArchived = input.archive;
    conversation.updatedAt = new Date();

    return { success: true };
  });

// Block/unblock user
export const blockUser = protectedProcedure
  .input(z.object({
    userId: z.string(),
    block: z.boolean(),
    reason: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const currentUserId = ctx.user.id;
    
    if (currentUserId === input.userId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot block yourself',
      });
    }

    const existingBlock = blockedUsers.find(b => 
      b.userId === currentUserId && b.blockedUserId === input.userId
    );

    if (input.block && !existingBlock) {
      const block: BlockedUser = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUserId,
        blockedUserId: input.userId,
        reason: input.reason,
        createdAt: new Date(),
      };
      
      blockedUsers.push(block);
    } else if (!input.block && existingBlock) {
      const blockIndex = blockedUsers.findIndex(b => b.id === existingBlock.id);
      if (blockIndex !== -1) {
        blockedUsers.splice(blockIndex, 1);
      }
    }

    return { success: true };
  });

// Get blocked users
export const getBlockedUsers = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user.id;
    
    const userBlocks = blockedUsers.filter(b => b.userId === userId);
    
    const blockedUserDetails = userBlocks.map(block => {
      const user = mockUsers.find((u: MockUser) => u.id === block.blockedUserId);
      return {
        ...block,
        user: user || { id: block.blockedUserId, username: 'Unknown', displayName: 'Unknown User' },
      };
    });

    return blockedUserDetails;
  });

// Report a message
export const reportMessage = protectedProcedure
  .input(z.object({
    messageId: z.string(),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
    description: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const message = messages.find(m => m.id === input.messageId);
    
    if (!message) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }

    // Check if user is participant in the conversation
    const conversation = conversations.find(c => 
      c.id === message.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    }

    const report: MessageReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId: input.messageId,
      reporterId: userId,
      reason: input.reason,
      description: input.description,
      status: 'pending',
      createdAt: new Date(),
    };

    messageReports.push(report);

    return { success: true };
  });

// Add reaction to message
export const addReaction = protectedProcedure
  .input(z.object({
    messageId: z.string(),
    emoji: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const message = messages.find(m => m.id === input.messageId);
    
    if (!message) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }

    // Check if user is participant in the conversation
    const conversation = conversations.find(c => 
      c.id === message.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    }

    // Remove existing reaction from this user on this message
    const existingReactionIndex = messageReactions.findIndex(r => 
      r.messageId === input.messageId && r.userId === userId
    );
    
    if (existingReactionIndex !== -1) {
      messageReactions.splice(existingReactionIndex, 1);
    }

    // Add new reaction
    const reaction: MessageReaction = {
      id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId: input.messageId,
      userId,
      emoji: input.emoji,
      createdAt: new Date(),
    };

    messageReactions.push(reaction);

    return { success: true };
  });

// Remove reaction from message
export const removeReaction = protectedProcedure
  .input(z.object({
    messageId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const reactionIndex = messageReactions.findIndex(r => 
      r.messageId === input.messageId && r.userId === userId
    );
    
    if (reactionIndex === -1) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Reaction not found',
      });
    }

    messageReactions.splice(reactionIndex, 1);

    return { success: true };
  });

// Get message reactions
export const getMessageReactions = protectedProcedure
  .input(z.object({
    messageId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    const reactions = messageReactions.filter(r => r.messageId === input.messageId);
    
    const reactionsWithUsers = reactions.map(reaction => {
      const user = mockUsers.find(u => u.id === reaction.userId);
      return {
        ...reaction,
        user: user || { id: reaction.userId, username: 'Unknown', displayName: 'Unknown User' },
      };
    });

    return reactionsWithUsers;
  });

// Set typing indicator
export const setTyping = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
    isTyping: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    if (!typingUsers.has(input.conversationId)) {
      typingUsers.set(input.conversationId, new Set());
    }

    const conversationTyping = typingUsers.get(input.conversationId)!;
    
    if (input.isTyping) {
      conversationTyping.add(userId);
    } else {
      conversationTyping.delete(userId);
    }

    return { success: true };
  });

// Get typing indicators for conversation
export const getTypingIndicators = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    const conversationTyping = typingUsers.get(input.conversationId) || new Set();
    const typingUserIds = Array.from(conversationTyping).filter(id => id !== userId);
    
    const typingIndicators = typingUserIds.map(id => {
      const user = mockUsers.find(u => u.id === id);
      return {
        conversationId: input.conversationId,
        userId: id,
        username: user?.username || 'Unknown',
        isTyping: true,
      };
    });

    return typingIndicators;
  });

// Search conversations
export const searchConversations = protectedProcedure
  .input(z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(20).default(10),
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId) && !conv.isArchived
    );

    const searchResults = userConversations.filter(conv => {
      // Search in last message content
      if (conv.lastMessage?.content.toLowerCase().includes(input.query.toLowerCase())) {
        return true;
      }
      
      // Search in participant names
      const otherParticipantId = conv.participants.find(id => id !== userId);
      if (otherParticipantId) {
        const user = mockUsers.find(u => u.id === otherParticipantId);
        const restaurant = mockRestaurants.find(r => r.id === otherParticipantId);
        
        if (user && (
          user.username.toLowerCase().includes(input.query.toLowerCase()) ||
          user.displayName.toLowerCase().includes(input.query.toLowerCase())
        )) {
          return true;
        }
        
        if (restaurant && restaurant.name.toLowerCase().includes(input.query.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    });

    // Sort by relevance (last activity)
    searchResults.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    return searchResults.slice(0, input.limit);
  });

// Get unread message count
export const getUnreadCount = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user.id;
    
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId) && !conv.isArchived
    );

    const totalUnread = userConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return { unreadCount: totalUnread };
  });

// Get online users and contacts
export const getOnlineUsers = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user.id;
    
    // Get users that current user has conversations with
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId)
    );
    
    const contactIds = new Set<string>();
    userConversations.forEach(conv => {
      conv.participants.forEach(id => {
        if (id !== userId) contactIds.add(id);
      });
    });
    
    const onlineContacts = Array.from(contactIds)
      .map(id => mockUsers.find(u => u.id === id))
      .filter(user => user && onlineUsers.has(user.id))
      .map(user => ({
        id: user!.id,
        username: user!.username,
        displayName: user!.displayName,
        avatar: user!.avatar,
        isOnline: true,
      }));
    
    return onlineContacts;
  });

// Set user online status
export const setOnlineStatus = protectedProcedure
  .input(z.object({
    isOnline: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    if (input.isOnline) {
      onlineUsers.add(userId);
    } else {
      onlineUsers.delete(userId);
      
      // Update last seen for user
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        user.lastSeen = new Date();
      }
    }
    
    return { success: true };
  });

// Get message delivery status
export const getMessageStatus = protectedProcedure
  .input(z.object({
    messageId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    const message = messages.find(m => m.id === input.messageId);
    
    if (!message) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }
    
    // Check if user has access to this message
    const conversation = conversations.find(c => 
      c.id === message.conversationId && c.participants.includes(ctx.user.id)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    }
    
    return {
      messageId: message.id,
      status: message.isRead ? 'read' : 'delivered',
      timestamp: message.updatedAt,
    };
  });

// Bulk operations
export const bulkMarkAsRead = protectedProcedure
  .input(z.object({
    conversationIds: z.array(z.string()),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    let totalMarked = 0;
    
    for (const conversationId of input.conversationIds) {
      const conversation = conversations.find(c => 
        c.id === conversationId && c.participants.includes(userId)
      );
      
      if (conversation) {
        const conversationMessages = messages.filter(m => 
          m.conversationId === conversationId && 
          m.receiverId === userId && 
          !m.isRead
        );
        
        conversationMessages.forEach(message => {
          message.isRead = true;
          message.updatedAt = new Date();
          totalMarked++;
        });
        
        conversation.unreadCount = 0;
      }
    }
    
    return { markedCount: totalMarked };
  });

// Get conversation participants
export const getConversationParticipants = protectedProcedure
  .input(z.object({
    conversationId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    
    const conversation = conversations.find(c => 
      c.id === input.conversationId && c.participants.includes(userId)
    );
    
    if (!conversation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }
    
    const participants = conversation.participants
      .map(id => {
        const user = mockUsers.find(u => u.id === id);
        const restaurant = mockRestaurants.find(r => r.id === id);
        
        if (user) {
          return {
            id: user.id,
            type: 'user' as const,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            isOnline: onlineUsers.has(user.id),
            lastSeen: user.lastSeen,
          };
        }
        
        if (restaurant) {
          return {
            id: restaurant.id,
            type: 'restaurant' as const,
            name: restaurant.name,
            avatar: restaurant.avatar,
            isVerified: restaurant.isVerified,
          };
        }
        
        return null;
      })
      .filter(Boolean);
    
    return participants;
  });