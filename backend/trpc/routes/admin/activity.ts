import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import type { AdminActivity } from '@/types/admin';

// Mock activity log - in production, this would be stored in database
const activityLog: AdminActivity[] = [
  {
    id: '1',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    action: 'User account suspended',
    target: {
      type: 'user',
      id: 'user_123',
      name: 'john_doe',
    },
    details: 'Suspended for violating community guidelines - spam posting',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '2',
    adminId: 'admin_2',
    adminName: 'Content Moderator',
    action: 'Post removed',
    target: {
      type: 'post',
      id: 'post_456',
      name: 'Inappropriate restaurant review',
    },
    details: 'Removed for containing offensive language and false claims',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    action: 'Restaurant claim approved',
    target: {
      type: 'restaurant',
      id: 'rest_789',
      name: 'Pizza Palace Douala',
    },
    details: 'Verified ownership documents and approved claim request',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '4',
    adminId: 'admin_2',
    adminName: 'Content Moderator',
    action: 'Comment flagged',
    target: {
      type: 'comment',
      id: 'comment_101',
      name: 'Spam comment on restaurant review',
    },
    details: 'Flagged comment for manual review - potential spam',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '5',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    action: 'Platform settings updated',
    target: {
      type: 'user',
      id: 'settings_1',
      name: 'Auto-moderation settings',
    },
    details: 'Enabled auto-moderation for posts with flagged content threshold set to 3',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

export const logAdminActivityProcedure = publicProcedure
  .input(z.object({
    action: z.string(),
    targetType: z.enum(['user', 'restaurant', 'post', 'comment', 'claim']),
    targetId: z.string(),
    targetName: z.string(),
    details: z.string().optional(),
    adminId: z.string(),
    adminName: z.string(),
  }))
  .mutation(async ({ input }) => {
    const newActivity: AdminActivity = {
      id: `activity_${Date.now()}`,
      adminId: input.adminId,
      adminName: input.adminName,
      action: input.action,
      target: {
        type: input.targetType,
        id: input.targetId,
        name: input.targetName,
      },
      details: input.details,
      timestamp: new Date().toISOString(),
    };

    // In production, save to database
    activityLog.unshift(newActivity);
    console.log('[Admin Activity]', newActivity);

    return { success: true, activity: newActivity };
  });

export const getAdminActivitiesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    adminId: z.string().optional(),
    targetType: z.enum(['user', 'restaurant', 'post', 'comment', 'claim']).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }))
  .query(async ({ input }) => {
    let filteredActivities = [...activityLog];

    // Filter by admin ID
    if (input.adminId) {
      filteredActivities = filteredActivities.filter(
        activity => activity.adminId === input.adminId
      );
    }

    // Filter by target type
    if (input.targetType) {
      filteredActivities = filteredActivities.filter(
        activity => activity.target.type === input.targetType
      );
    }

    // Filter by date range
    if (input.dateRange) {
      const startDate = new Date(input.dateRange.start);
      const endDate = new Date(input.dateRange.end);
      filteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate && activityDate <= endDate;
      });
    }

    // Sort by timestamp (newest first)
    filteredActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const paginatedActivities = filteredActivities.slice(
      input.offset,
      input.offset + input.limit
    );

    return {
      activities: paginatedActivities,
      total: filteredActivities.length,
      hasMore: input.offset + input.limit < filteredActivities.length,
    };
  });

export const getActivityStatsProcedure = publicProcedure
  .input(z.object({
    timeRange: z.enum(['24h', '7d', '30d']).default('24h'),
  }))
  .query(async ({ input }) => {
    const now = new Date();
    let startTime: Date;

    switch (input.timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentActivities = activityLog.filter(activity => 
      new Date(activity.timestamp) >= startTime
    );

    const stats = {
      totalActions: recentActivities.length,
      actionsByType: {
        user: recentActivities.filter(a => a.target.type === 'user').length,
        restaurant: recentActivities.filter(a => a.target.type === 'restaurant').length,
        post: recentActivities.filter(a => a.target.type === 'post').length,
        comment: recentActivities.filter(a => a.target.type === 'comment').length,
        claim: recentActivities.filter(a => a.target.type === 'claim').length,
      },
      topAdmins: Object.entries(
        recentActivities.reduce((acc, activity) => {
          acc[activity.adminName] = (acc[activity.adminName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      actionsOverTime: generateTimeSeriesData(recentActivities, input.timeRange),
    };

    return stats;
  });

function generateTimeSeriesData(activities: AdminActivity[], timeRange: string) {
  const now = new Date();
  const data: { time: string; count: number }[] = [];

  if (timeRange === '24h') {
    // Generate hourly data for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const count = activities.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime >= hourStart && activityTime < hourEnd;
      }).length;

      data.push({
        time: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        count,
      });
    }
  } else if (timeRange === '7d') {
    // Generate daily data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const count = activities.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime >= dayStart && activityTime < dayEnd;
      }).length;

      data.push({
        time: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }
  } else {
    // Generate weekly data for last 30 days
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const count = activities.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime >= weekStart && activityTime < weekEnd;
      }).length;

      data.push({
        time: `Week ${4 - i}`,
        count,
      });
    }
  }

  return data;
}