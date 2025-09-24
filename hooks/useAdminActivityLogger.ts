import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useAdmin } from '@/providers/AdminProvider';

export function useAdminActivityLogger() {
  const { adminUser } = useAdmin();
  const logActivityMutation = trpc.admin.activity.log.useMutation();

  const logActivity = useCallback(async (
    action: string,
    targetType: 'user' | 'restaurant' | 'post' | 'comment' | 'claim',
    targetId: string,
    targetName: string,
    details?: string
  ) => {
    if (!adminUser) {
      console.warn('[AdminActivityLogger] No admin user found');
      return;
    }

    // Input validation
    if (!action?.trim() || action.length > 200) {
      console.warn('[AdminActivityLogger] Invalid action');
      return;
    }
    if (!targetId?.trim() || targetId.length > 100) {
      console.warn('[AdminActivityLogger] Invalid targetId');
      return;
    }
    if (!targetName?.trim() || targetName.length > 200) {
      console.warn('[AdminActivityLogger] Invalid targetName');
      return;
    }
    if (details && details.length > 500) {
      console.warn('[AdminActivityLogger] Details too long');
      return;
    }

    const sanitizedAction = action.trim();
    const sanitizedTargetId = targetId.trim();
    const sanitizedTargetName = targetName.trim();
    const sanitizedDetails = details?.trim();

    try {
      await logActivityMutation.mutateAsync({
        action: sanitizedAction,
        targetType,
        targetId: sanitizedTargetId,
        targetName: sanitizedTargetName,
        details: sanitizedDetails,
        adminId: adminUser.id,
        adminName: adminUser.displayName,
      });
    } catch (error) {
      console.error('[AdminActivityLogger] Failed to log activity:', error);
    }
  }, [adminUser, logActivityMutation]);

  // Convenience methods for common actions
  const logUserAction = useCallback((
    action: string,
    userId: string,
    username: string,
    details?: string
  ) => {
    if (!action?.trim() || !userId?.trim() || !username?.trim()) return;
    return logActivity(action.trim(), 'user', userId.trim(), username.trim(), details?.trim());
  }, [logActivity]);

  const logRestaurantAction = useCallback((
    action: string,
    restaurantId: string,
    restaurantName: string,
    details?: string
  ) => {
    if (!action?.trim() || !restaurantId?.trim() || !restaurantName?.trim()) return;
    return logActivity(action.trim(), 'restaurant', restaurantId.trim(), restaurantName.trim(), details?.trim());
  }, [logActivity]);

  const logPostAction = useCallback((
    action: string,
    postId: string,
    postTitle: string,
    details?: string
  ) => {
    if (!action?.trim() || !postId?.trim() || !postTitle?.trim()) return;
    return logActivity(action.trim(), 'post', postId.trim(), postTitle.trim(), details?.trim());
  }, [logActivity]);

  const logCommentAction = useCallback((
    action: string,
    commentId: string,
    commentPreview: string,
    details?: string
  ) => {
    if (!action?.trim() || !commentId?.trim() || !commentPreview?.trim()) return;
    return logActivity(action.trim(), 'comment', commentId.trim(), commentPreview.trim(), details?.trim());
  }, [logActivity]);

  const logClaimAction = useCallback((
    action: string,
    claimId: string,
    claimDescription: string,
    details?: string
  ) => {
    if (!action?.trim() || !claimId?.trim() || !claimDescription?.trim()) return;
    return logActivity(action.trim(), 'claim', claimId.trim(), claimDescription.trim(), details?.trim());
  }, [logActivity]);

  return {
    logActivity,
    logUserAction,
    logRestaurantAction,
    logPostAction,
    logCommentAction,
    logClaimAction,
    isLogging: logActivityMutation.isPending,
  };
}