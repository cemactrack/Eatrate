export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'restaurant_share';
  metadata?: {
    imageUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    restaurantId?: string;
    restaurantName?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'restaurant_support';
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithDetails extends Conversation {
  otherParticipant?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
  restaurant?: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  };
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: Date;
}

export interface MessageReport {
  id: string;
  messageId: string;
  reporterId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}