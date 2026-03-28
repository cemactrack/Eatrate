import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function AdminModerationScreen() {
  const [activeTab, setActiveTab] = useState<'flagged' | 'reports'>('flagged');
  const { hasPermission } = useAdmin();

  const flaggedContentQuery = trpc.admin.moderation.flaggedContent.useQuery({
    type: 'all',
    limit: 20,
  });

  const reportsQuery = trpc.admin.moderation.reports.useQuery({
    status: 'pending',
    limit: 20,
  });

  const moderateContentMutation = trpc.admin.moderation.moderateContent.useMutation({
    onSuccess: () => {
      flaggedContentQuery.refetch();
    },
  });

  const updateReportMutation = trpc.admin.moderation.updateReport.useMutation({
    onSuccess: () => {
      reportsQuery.refetch();
    },
  });

  const handleContentAction = (
    contentType: 'post' | 'comment',
    contentId: string,
    action: 'approve' | 'remove' | 'flag'
  ) => {
    if (!hasPermission('moderate_content')) {
      const message = 'You do not have permission to moderate content.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Denied', message);
      }
      return;
    }

    moderateContentMutation.mutate({
      contentType,
      contentId,
      action,
      reason: `${action} by admin`,
    });
  };

  const handleReportAction = (
    reportId: string,
    status: 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    if (!hasPermission('moderate_content')) {
      const message = 'You do not have permission to handle reports.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Permission Denied', message);
      }
      return;
    }

    updateReportMutation.mutate({
      reportId,
      status,
      adminNotes: `${status} by admin`,
    });
  };

  if (!hasPermission('moderate_content')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermission}>
          <Flag size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.noPermissionText}>
            You don&apos;t have permission to moderate content.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const flaggedContent = flaggedContentQuery.data;
  const reports = reportsQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'flagged' && styles.tabActive]}
          onPress={() => setActiveTab('flagged')}
        >
          <Flag size={20} color={activeTab === 'flagged' ? 'white' : Colors.light.tabIconDefault} />
          <Text style={[styles.tabText, activeTab === 'flagged' && styles.tabTextActive]}>
            Flagged Content
          </Text>
          {flaggedContent && (flaggedContent.posts.length + flaggedContent.comments.length) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {flaggedContent.posts.length + flaggedContent.comments.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <AlertTriangle size={20} color={activeTab === 'reports' ? 'white' : Colors.light.tabIconDefault} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Reports
          </Text>
          {reports && reports.reports.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{reports.reports.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'flagged' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Flagged Posts</Text>
            {flaggedContent?.posts.map((post) => (
              <View key={post.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <View style={styles.userInfo}>
                    <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
                    <View>
                      <Text style={styles.userName}>{post.user.displayName}</Text>
                      <Text style={styles.userHandle}>@{post.user.username}</Text>
                    </View>
                  </View>
                  <View style={styles.contentMeta}>
                    <Calendar size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.contentDate}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.contentText}>{post.content.text}</Text>

                {post.content.images && post.content.images.length > 0 && (
                  <Image source={{ uri: post.content.images[0] }} style={styles.contentImage} />
                )}

                <View style={styles.contentStats}>
                  <View style={styles.stat}>
                    <MessageSquare size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.statText}>{post.commentsCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Eye size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.statText}>{post.likesCount}</Text>
                  </View>
                </View>

                <View style={styles.contentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleContentAction('post', post.id, 'approve')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleContentAction('post', post.id, 'remove')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Flagged Comments</Text>
            {flaggedContent?.comments.map((comment) => (
              <View key={comment.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <View style={styles.userInfo}>
                    <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
                    <View>
                      <Text style={styles.userName}>{comment.user.displayName}</Text>
                      <Text style={styles.userHandle}>@{comment.user.username}</Text>
                    </View>
                  </View>
                  <View style={styles.contentMeta}>
                    <Calendar size={14} color={Colors.light.tabIconDefault} />
                    <Text style={styles.contentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.contentText}>{comment.text}</Text>

                <View style={styles.contentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleContentAction('comment', comment.id, 'approve')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleContentAction('comment', comment.id, 'remove')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'reports' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Pending Reports</Text>
            {reports?.reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportType}>
                    <User size={16} color={Colors.light.tint} />
                    <Text style={styles.reportTypeText}>{report.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.reportDate}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.reportReason}>{report.reason}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>

                <View style={styles.reportMeta}>
                  <Text style={styles.reportMetaText}>
                    Reported by: {report.reporterName}
                  </Text>
                  <Text style={styles.reportMetaText}>
                    Target ID: {report.targetId}
                  </Text>
                </View>

                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleReportAction(report.id, 'resolved')}
                  >
                    <CheckCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleReportAction(report.id, 'dismissed')}
                  >
                    <XCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Dismiss</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
    marginLeft: 8,
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
    marginTop: 8,
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userHandle: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  contentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  dismissButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
    marginLeft: 4,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMeta: {
    marginBottom: 16,
  },
  reportMetaText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 4,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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