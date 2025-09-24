import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  Heart,
  MessageCircle,
  Share,
  Flag,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function PostManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'approved' | 'removed'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const postsQuery = trpc.admin.posts.list.useQuery({
    search: searchQuery,
    status: statusFilter,
    limit: 20,
    offset: 0,
  });

  const moderatePostMutation = trpc.admin.moderation.moderateContent.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
    },
  });

  const deletePostMutation = trpc.admin.posts.delete.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
    },
  });

  const handleModeratePost = (postId: string, action: 'approve' | 'remove' | 'flag') => {
    const actionText = action === 'approve' ? 'approve' : action === 'remove' ? 'remove' : 'flag';
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Post`,
      `Are you sure you want to ${actionText} this post?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            moderatePostMutation.mutate({
              contentType: 'post',
              contentId: postId,
              action,
              reason: `Admin ${actionText}`,
            });
          },
        },
      ]
    );
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePostMutation.mutate({ postId, reason: 'Admin deletion' });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'flagged': return '#f59e0b';
      case 'removed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#10b981" />;
      case 'flagged': return <Flag size={16} color="#f59e0b" />;
      case 'removed': return <XCircle size={16} color="#ef4444" />;
      default: return <Eye size={16} color="#6b7280" />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.tabIconDefault} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.tabIconDefault}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'flagged', 'approved', 'removed'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {postsQuery.data?.posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.user.displayName}</Text>
                <Text style={styles.username}>@{post.user.username}</Text>
                <Text style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.postActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(post.status || 'normal') }]}>
                  {getStatusIcon(post.status || 'normal')}
                  <Text style={styles.statusText}>{post.status || 'normal'}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={16} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>

            {post.content.text && (
              <Text style={styles.postContent}>{post.content.text}</Text>
            )}

            {post.content.images && post.content.images.length > 0 && (
              <ScrollView horizontal style={styles.imagesContainer}>
                {post.content.images.map((image, index) => (
                  <Image key={index} source={{ uri: image }} style={styles.postImage} />
                ))}
              </ScrollView>
            )}

            {post.restaurant && (
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>📍 {post.restaurant.name}</Text>
                <Text style={styles.restaurantLocation}>{post.restaurant.location}</Text>
              </View>
            )}

            <View style={styles.postStats}>
              <View style={styles.statItem}>
                <Heart size={16} color="#ef4444" />
                <Text style={styles.statText}>{post.likesCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MessageCircle size={16} color={Colors.light.tabIconDefault} />
                <Text style={styles.statText}>{post.commentsCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Share size={16} color={Colors.light.tabIconDefault} />
                <Text style={styles.statText}>{post.sharesCount}</Text>
              </View>
            </View>

            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/posts/${post.id}`)}
              >
                <Eye size={16} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>

              {(!post.status || post.status === 'flagged') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleModeratePost(post.id, 'approve')}
                >
                  <CheckCircle size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                </TouchableOpacity>
              )}

              {post.status === 'flagged' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleModeratePost(post.id, 'remove')}
                >
                  <XCircle size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
                </TouchableOpacity>
              )}

              {(!post.status || post.status === 'approved') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.flagButton]}
                  onPress={() => handleModeratePost(post.id, 'flag')}
                >
                  <Flag size={16} color="#f59e0b" />
                  <Text style={[styles.actionButtonText, styles.flagButtonText]}>Flag</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeletePost(post.id)}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {postsQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        )}

        {postsQuery.data?.posts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  username: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  postDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  postActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  restaurantInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  restaurantLocation: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  postStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  postFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    color: 'white',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    color: 'white',
  },
  flagButton: {
    backgroundColor: '#fef3c7',
  },
  flagButtonText: {
    color: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});