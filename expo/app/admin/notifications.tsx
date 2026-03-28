import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  AlertTriangle,
  Flag,
  Activity,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function AdminNotificationsScreen() {
  const { hasPermission } = useAdmin();
  const router = useRouter();

  const notificationsQuery = trpc.admin.dashboard.notifications.useQuery();
  const markReadMutation = trpc.admin.dashboard.markNotificationRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate({ notificationId: notification.id });
    }

    if (notification.actionUrl) {
      // Navigate to the specific admin section
      if (notification.actionUrl.includes('/admin/reports')) {
        router.push('/admin/moderation');
      } else if (notification.actionUrl.includes('/admin/claims')) {
        router.push('/admin/moderation');
      } else if (notification.actionUrl.includes('/admin/system')) {
        router.push('/admin/settings');
      }
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor = priority === 'urgent' ? '#ef4444' : 
                     priority === 'high' ? '#f59e0b' : 
                     priority === 'medium' ? Colors.light.tint : '#6b7280';

    switch (type) {
      case 'report':
        return <Flag size={20} color={iconColor} />;
      case 'claim':
        return <CheckCircle size={20} color={iconColor} />;
      case 'system':
        return <AlertTriangle size={20} color={iconColor} />;
      case 'user_activity':
        return <Activity size={20} color={iconColor} />;
      default:
        return <Bell size={20} color={iconColor} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return Colors.light.tint;
      default:
        return '#6b7280';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!hasPermission('moderate_content') && !hasPermission('manage_users')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermission}>
          <Bell size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noPermissionText}>
            You don&apos;t have permission to view admin notifications.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {notificationsQuery.isLoading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You&apos;re all caught up! New admin notifications will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.notificationCardUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </View>
                  <View style={styles.notificationMeta}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(notification.priority) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(notification.priority) },
                        ]}
                      >
                        {notification.priority.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Clock size={12} color={Colors.light.tabIconDefault} />
                      <Text style={styles.timeText}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>

                {!notification.isRead && (
                  <View style={styles.unreadIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  unreadBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
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