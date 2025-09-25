export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'achievement' | 'event' | 'challenge' | 'restaurant' | 'system';
  title: string;
  message: string;
  imageUrl?: string;
  data?: Record<string, any>;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  categories: {
    social: boolean; // likes, comments, follows
    achievements: boolean; // badges, level ups
    events: boolean; // new events, reminders
    challenges: boolean; // new challenges, results
    restaurants: boolean; // new restaurants, updates
    system: boolean; // app updates, maintenance
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
  frequency: {
    instant: boolean;
    daily: boolean;
    weekly: boolean;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  categoryId?: string;
  threadId?: string;
}

export interface NotificationTemplate {
  type: AppNotification['type'];
  title: (data: any) => string;
  message: (data: any) => string;
  actionUrl?: (data: any) => string;
  priority: AppNotification['priority'];
}