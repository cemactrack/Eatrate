export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermission[];
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'restaurants' | 'posts' | 'comments' | 'claims' | 'analytics' | 'system';
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  restaurants: {
    total: number;
    verified: number;
    pendingClaims: number;
    newToday: number;
  };
  posts: {
    total: number;
    today: number;
    thisWeek: number;
    flagged: number;
  };
  comments: {
    total: number;
    today: number;
    flagged: number;
  };
  engagement: {
    totalLikes: number;
    totalShares: number;
    avgPostsPerUser: number;
    activeUsersToday: number;
  };
}

export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: {
    type: 'user' | 'restaurant' | 'post' | 'comment' | 'claim';
    id: string;
    name: string;
  };
  details?: string;
  timestamp: string;
}

export interface AdminReport {
  id: string;
  type: 'user' | 'restaurant' | 'post' | 'comment';
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminNotification {
  id: string;
  type: 'report' | 'claim' | 'system' | 'user_activity';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    activeConnections: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface AdminSettings {
  platform: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    postingEnabled: boolean;
    commentsEnabled: boolean;
  };
  moderation: {
    autoModeration: boolean;
    requireApproval: boolean;
    flaggedContentThreshold: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
  };
  features: {
    restaurantClaims: boolean;
    userVerification: boolean;
    premiumFeatures: boolean;
  };
}