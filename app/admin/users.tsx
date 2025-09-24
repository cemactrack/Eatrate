import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Ban,
  Trash2,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import { useAdminActivityLogger } from '@/hooks/useAdminActivityLogger';
import Colors from '@/constants/colors';

export default function AdminUsersScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { hasPermission } = useAdmin();
  const { logUserAction } = useAdminActivityLogger();
  const router = useRouter();

  const usersQuery = trpc.admin.users.list.useQuery({
    search: searchQuery,
    status: statusFilter,
    limit: 50,
  });

  const updateUserStatusMutation = trpc.admin.users.updateStatus.useMutation({
    onSuccess: (_, variables) => {
      // Log the admin activity
      logUserAction(
        `User ${variables.status}`,
        variables.userId,
        `User ${variables.userId}`,
        variables.reason
      );
      usersQuery.refetch();
      setSelectedUsers(new Set());
    },
  });

  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: (_, variables) => {
      // Log the admin activity
      logUserAction(
        'User deleted',
        variables.userId,
        `User ${variables.userId}`,
        variables.reason
      );
      usersQuery.refetch();
      setSelectedUsers(new Set());
    },
  });

  const filteredUsers = useMemo(() => {
    if (!usersQuery.data?.users) return [];
    return usersQuery.data.users.filter(user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersQuery.data?.users, searchQuery]);

  const handleUserAction = (userId: string, action: 'view' | 'suspend' | 'ban' | 'delete') => {
    if (!hasPermission('manage_users')) {
      const message = 'You do not have permission to perform this action.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Denied', message);
      }
      return;
    }

    switch (action) {
      case 'view':
        router.push(`/users/${userId}`);
        break;
      case 'suspend':
        updateUserStatusMutation.mutate({
          userId,
          status: 'suspended',
          reason: 'Suspended by admin',
        });
        break;
      case 'ban':
        updateUserStatusMutation.mutate({
          userId,
          status: 'banned',
          reason: 'Banned by admin',
        });
        break;
      case 'delete':
        const confirmMessage = 'Are you sure you want to delete this user? This action cannot be undone.';
        const confirmAction = () => {
          deleteUserMutation.mutate({
            userId,
            reason: 'Deleted by admin',
          });
        };
        
        if (Platform.OS === 'web') {
          if (confirm(confirmMessage)) {
            confirmAction();
          }
        } else {
          Alert.alert(
            'Delete User',
            confirmMessage,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: confirmAction },
            ]
          );
        }
        break;
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleBulkAction = (action: 'suspend' | 'activate') => {
    if (selectedUsers.size === 0) return;

    const status = action === 'suspend' ? 'suspended' : 'active';
    const reason = `Bulk ${action} by admin`;

    selectedUsers.forEach(userId => {
      updateUserStatusMutation.mutate({ userId, status, reason });
    });
  };

  if (!hasPermission('manage_users')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermission}>
          <UserX size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noPermissionText}>
            You don't have permission to manage users.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.tabIconDefault} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.tabIconDefault}
          />
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'active', 'suspended', 'banned'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.filterButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedUsers.size > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={() => handleBulkAction('activate')}
              >
                <UserCheck size={16} color={Colors.light.tint} />
                <Text style={styles.bulkActionButtonText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={() => handleBulkAction('suspend')}
              >
                <Ban size={16} color="#f59e0b" />
                <Text style={styles.bulkActionButtonText}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {usersQuery.isLoading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userCheckbox}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedUsers.has(user.id) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedUsers.has(user.id) && (
                      <Text style={styles.checkboxText}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.displayName}</Text>
                    <Text style={styles.userUsername}>@{user.username}</Text>
                  </View>
                  <Text style={styles.userStats}>
                    {user.postsCount} posts • {user.followersCount} followers
                  </Text>
                  <View style={styles.userBadges}>
                    {user.badges.map((badge) => (
                      <View key={badge} style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUserAction(user.id, 'view')}
                  >
                    <Eye size={16} color={Colors.light.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUserAction(user.id, 'suspend')}
                  >
                    <Ban size={16} color="#f59e0b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUserAction(user.id, 'delete')}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
  },
  bulkActionsText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  bulkActionButtons: {
    flexDirection: 'row',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'white',
    marginLeft: 8,
  },
  bulkActionButtonText: {
    fontSize: 12,
    color: Colors.light.text,
    marginLeft: 4,
    fontWeight: '500',
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
  usersList: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  userUsername: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  userStats: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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