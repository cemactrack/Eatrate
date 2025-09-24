import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import type { AdminStats, AdminActivity, AdminNotification, SystemHealth } from '@/types/admin';

export const getAdminStatsProcedure = publicProcedure
  .query(async (): Promise<AdminStats> => {
    // Mock data - replace with real database queries
    return {
      users: {
        total: 15420,
        active: 8932,
        newToday: 127,
        newThisWeek: 892,
      },
      restaurants: {
        total: 2341,
        verified: 1876,
        pendingClaims: 23,
        newToday: 8,
      },
      posts: {
        total: 45678,
        today: 234,
        thisWeek: 1567,
        flagged: 12,
      },
      comments: {
        total: 123456,
        today: 567,
        flagged: 8,
      },
      engagement: {
        totalLikes: 234567,
        totalShares: 12345,
        avgPostsPerUser: 2.96,
        activeUsersToday: 3421,
      },
    };
  });

export const getAdminActivitiesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }): Promise<AdminActivity[]> => {
    // Mock data - replace with real database queries
    const activities: AdminActivity[] = [
      {
        id: '1',
        adminId: 'admin_1',
        adminName: 'John Admin',
        action: 'Approved restaurant claim',
        target: {
          type: 'restaurant',
          id: 'rest_123',
          name: 'Pizza Palace',
        },
        details: 'Verified ownership documents',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '2',
        adminId: 'admin_2',
        adminName: 'Sarah Moderator',
        action: 'Removed flagged post',
        target: {
          type: 'post',
          id: 'post_456',
          name: 'Inappropriate content',
        },
        details: 'Violated community guidelines',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: '3',
        adminId: 'admin_1',
        adminName: 'John Admin',
        action: 'Suspended user account',
        target: {
          type: 'user',
          id: 'user_789',
          name: 'spammer_user',
        },
        details: 'Multiple spam reports',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    return activities.slice(input.offset, input.offset + input.limit);
  });

export const getAdminNotificationsProcedure = publicProcedure
  .query(async (): Promise<AdminNotification[]> => {
    // Mock data - replace with real database queries
    return [
      {
        id: '1',
        type: 'report',
        title: 'New Content Report',
        message: 'User reported inappropriate content in post #12345',
        priority: 'high',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        actionUrl: '/admin/reports/12345',
      },
      {
        id: '2',
        type: 'claim',
        title: 'Restaurant Claim Pending',
        message: 'New restaurant ownership claim requires review',
        priority: 'medium',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        actionUrl: '/admin/claims/pending',
      },
      {
        id: '3',
        type: 'system',
        title: 'High Memory Usage',
        message: 'Server memory usage is at 85%',
        priority: 'urgent',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        actionUrl: '/admin/system/health',
      },
    ];
  });

export const getSystemHealthProcedure = publicProcedure
  .query(async (): Promise<SystemHealth> => {
    // Mock data - replace with real system monitoring
    return {
      status: 'healthy',
      uptime: 99.98,
      memory: {
        used: 6.8,
        total: 16,
        percentage: 42.5,
      },
      database: {
        status: 'connected',
        responseTime: 12,
        activeConnections: 45,
      },
      api: {
        requestsPerMinute: 1250,
        averageResponseTime: 180,
        errorRate: 0.02,
      },
      storage: {
        used: 245,
        total: 1000,
        percentage: 24.5,
      },
    };
  });

export const markNotificationReadProcedure = publicProcedure
  .input(z.object({
    notificationId: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Marking notification ${input.notificationId} as read`);
    return { success: true };
  });