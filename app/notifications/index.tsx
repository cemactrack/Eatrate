import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Settings, Trash2, Check, CheckCheck, Heart, MessageSquare, UserPlus, Award, Calendar, AlertTriangle } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useNotifications } from '@/providers/NotificationProvider';
import { useLocalization } from '@/providers/LocalizationProvider';
import { AppNotification } from '@/types/notifications';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
}

const NotificationItem = React.memo(function NotificationItem({ 
  notification, 
  onPress, 
  onDelete, 
  onMarkAsRead 
}: NotificationItemProps) {
  const { colors } = useSettings();
  const { t, formatDate } = useLocalization();

  const getNotificationIcon = () => {
    const iconProps = { size: 20, color: colors.tint };
    
    switch (notification.type) {
      case 'like':
        return <Heart {...iconProps} />;
      case 'comment':
        return <MessageSquare {...iconProps} />;
      case 'follow':
        return <UserPlus {...iconProps} />;
      case 'achievement':
        return <Award {...iconProps} />;
      case 'event':
        return <Calendar {...iconProps} />;
      case 'system':
        return <AlertTriangle {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'normal':
        return colors.tint;
      case 'low':
        return colors.secondary;
      default:
        return colors.secondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        !notification.isRead && { backgroundColor: colors.accent }
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            {getNotificationIcon()}
          </View>
          
          <View style={styles.notificationInfo}>
            <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.secondary }]}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          
          <View style={styles.notificationActions}>
            {!notification.isRead && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={() => onMarkAsRead(notification.id)}
              >
                <Check size={14} color="white" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={() => onDelete(notification.id)}
            >
              <Trash2 size={14} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.notificationMessage, { color: colors.secondary }]} numberOfLines={2}>
          {notification.message}
        </Text>
        
        {notification.imageUrl && (
          <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} />
        )}
        
        <View style={styles.notificationFooter}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
          <Text style={[styles.categoryText, { color: colors.secondary }]}>
            {notification.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function NotificationsScreen() {
  const { colors } = useSettings();
  const { t } = useLocalization();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadNotifications,
    getNotificationsByType,
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = React.useMemo(() => {
    switch (filter) {
      case 'unread':
        return getUnreadNotifications();
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  }, [notifications, filter, getUnreadNotifications]);

  const handleNotificationPress = useCallback((notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    } else {
      // Handle navigation based on notification type
      switch (notification.type) {
        case 'like':
        case 'comment':
          if (notification.data?.postId) {
            router.push(`/posts/${notification.data.postId}`);
          }
          break;
        case 'follow':
          if (notification.data?.userId) {
            router.push(`/users/${notification.data.userId}`);
          }
          break;
        case 'achievement':
          router.push('/achievements');
          break;
        case 'event':
          router.push('/events');
          break;
        default:
          break;
      }
    }
  }, [markAsRead, router]);

  const handleDeleteNotification = useCallback((notificationId: string) => {
    Alert.alert(
      t('common.delete'),
      'Are you sure you want to delete this notification?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  }, [deleteNotification, t]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsRead(notificationId);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => markAllAsRead(),
        },
      ]
    );
  }, [markAllAsRead, unreadCount, t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // In a real app, you would refetch notifications here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LoadingSpinner text="Loading notifications..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('nav.notifications')}
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.tint }]}
                onPress={handleMarkAllAsRead}
              >
                <CheckCheck size={16} color="white" />
                <Text style={styles.headerButtonText}>Mark All</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSettingsPress}
            >
              <Settings size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabs, { backgroundColor: colors.background }]}>
          {(['all', 'unread', 'read'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterTab,
                { backgroundColor: colors.card, borderColor: colors.border },
                filter === filterType && { backgroundColor: colors.tint, borderColor: colors.tint }
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterTabText,
                { color: colors.secondary },
                filter === filterType && { color: 'white' }
              ]}>
                {filterType === 'all' ? 'All' : filterType === 'unread' ? 'Unread' : 'Read'}
                {filterType === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications List */}
        <FlatList
          data={filteredNotifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onDelete={handleDeleteNotification}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.secondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
                {filter === 'unread' 
                  ? 'All caught up! Check back later for updates.'
                  : 'Notifications will appear here when you receive them.'}
              </Text>
            </View>
          }
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  notificationItem: {
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});