import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Settings,
  Shield,
  Activity,
  Bell,
  LogOut,
  Store,
  FileText,
  BarChart3,
  Truck,
  Flag,
  ClipboardList,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function AdminDashboard() {
  const { adminUser, isAdmin, logout } = useAdmin();
  const router = useRouter();

  const statsQuery = trpc.admin.dashboard.stats.useQuery();
  const notificationsQuery = trpc.admin.dashboard.notifications.useQuery();
  const systemHealthQuery = trpc.admin.dashboard.systemHealth.useQuery();

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/admin/login');
    }
  }, [isAdmin, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const refreshData = () => {
    statsQuery.refetch();
    notificationsQuery.refetch();
    systemHealthQuery.refetch();
  };

  if (!isAdmin || !adminUser) {
    return null;
  }

  const stats = statsQuery.data;
  const notifications = notificationsQuery.data;
  const systemHealth = systemHealthQuery.data;

  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isLoading}
            onRefresh={refreshData}
            tintColor={Colors.light.tint}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.adminName}>{adminUser.displayName}</Text>
            <Text style={styles.roleText}>{adminUser.role.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>
        </View>

        {systemHealth && (
          <View style={[styles.systemHealthCard, 
            systemHealth.status === 'healthy' ? styles.healthyCard :
            systemHealth.status === 'warning' ? styles.warningCard : styles.criticalCard
          ]}>
            <View style={styles.systemHealthHeader}>
              <Activity size={20} color="white" />
              <Text style={styles.systemHealthTitle}>System Status: {systemHealth.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.systemHealthDetail}>
              Uptime: {systemHealth.uptime}% | Memory: {systemHealth.memory.percentage}% | 
              API: {systemHealth.api.requestsPerMinute} req/min
            </Text>
          </View>
        )}

        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color={Colors.light.tint} />
              <Text style={styles.statNumber}>{stats.users.total.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
              <Text style={styles.statSubtext}>+{stats.users.newToday} today</Text>
            </View>

            <View style={styles.statCard}>
              <MessageSquare size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.posts.total.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Posts</Text>
              <Text style={styles.statSubtext}>+{stats.posts.today} today</Text>
            </View>

            <View style={styles.statCard}>
              <AlertTriangle size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{stats.posts.flagged}</Text>
              <Text style={styles.statLabel}>Flagged Content</Text>
              <Text style={styles.statSubtext}>Needs review</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp size={24} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.engagement.activeUsersToday.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Active Today</Text>
              <Text style={styles.statSubtext}>Users online</Text>
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/users')}
          >
            <Users size={20} color={Colors.light.tint} />
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>View and moderate user accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/moderation')}
          >
            <Shield size={20} color="#f59e0b" />
            <Text style={styles.actionTitle}>Content Moderation</Text>
            <Text style={styles.actionSubtitle}>Review flagged posts and reports</Text>
            {stats && stats.posts.flagged > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.posts.flagged}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/notifications')}
          >
            <Bell size={20} color="#10b981" />
            <Text style={styles.actionTitle}>Notifications</Text>
            <Text style={styles.actionSubtitle}>View admin alerts and updates</Text>
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/restaurants')}
          >
            <Store size={20} color="#8b5cf6" />
            <Text style={styles.actionTitle}>Restaurant Management</Text>
            <Text style={styles.actionSubtitle}>Manage restaurants and claims</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/posts')}
          >
            <FileText size={20} color="#10b981" />
            <Text style={styles.actionTitle}>Post Management</Text>
            <Text style={styles.actionSubtitle}>Monitor and moderate posts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/analytics')}
          >
            <BarChart3 size={20} color="#f59e0b" />
            <Text style={styles.actionTitle}>Analytics Dashboard</Text>
            <Text style={styles.actionSubtitle}>View platform insights and metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/suppliers')}
          >
            <Truck size={20} color="#06b6d4" />
            <Text style={styles.actionTitle}>Supplier Management</Text>
            <Text style={styles.actionSubtitle}>Manage suppliers and partnerships</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/claims')}
          >
            <ClipboardList size={20} color="#84cc16" />
            <Text style={styles.actionTitle}>Restaurant Claims</Text>
            <Text style={styles.actionSubtitle}>Review ownership claims</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/reports')}
          >
            <Flag size={20} color="#ef4444" />
            <Text style={styles.actionTitle}>User Reports</Text>
            <Text style={styles.actionSubtitle}>Handle user reports and complaints</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/admin/settings')}
          >
            <Settings size={20} color="#6b7280" />
            <Text style={styles.actionTitle}>Platform Settings</Text>
            <Text style={styles.actionSubtitle}>Configure app settings and features</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  systemHealthCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  healthyCard: {
    backgroundColor: '#10b981',
  },
  warningCard: {
    backgroundColor: '#f59e0b',
  },
  criticalCard: {
    backgroundColor: '#ef4444',
  },
  systemHealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  systemHealthTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  systemHealthDetail: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: '2%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: Colors.light.tint,
    marginTop: 2,
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginLeft: 12,
    flex: 2,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});