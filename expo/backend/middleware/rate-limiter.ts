import { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

export function createRateLimiter(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    // Get client IP address
    const clientIP = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
                     c.req.header('x-real-ip') || 
                     c.req.header('cf-connecting-ip') || 
                     'unknown';

    const now = Date.now();
    const key = `${clientIP}:${c.req.path}`;
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + options.windowMs
      };
    }
    
    // Increment request count
    entry.count++;
    rateLimitStore.set(key, entry);
    
    // Check if limit exceeded
    if (entry.count > options.maxRequests) {
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      return c.json({
        error: options.message || "Too many requests, please try again later.",
        retryAfter: resetInSeconds,
        limit: options.maxRequests,
        windowMs: options.windowMs
      }, 429);
    }
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', options.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (options.maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    
    await next();
  };
}

// Predefined rate limiters
export const writeOperationsLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: "Too many write requests, please try again later."
});

export const readOperationsLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  message: "Too many read requests, please try again later."
});

// Helper function to determine if a tRPC procedure is a write operation
export function isWriteOperation(procedurePath: string): boolean {
  const writeOperations = [
    // Reviews
    'reviews.create',
    'reviews.update', 
    'reviews.delete',
    
    // Posts
    'posts.create',
    'posts.createNew',
    'posts.update',
    'posts.delete',
    'posts.like',
    'posts.bookmark',
    'posts.share',
    'posts.report',
    'postsMain.create',
    'postsMain.update',
    'postsMain.delete',
    
    // Comments
    'comments.create',
    'commentsMain.create',
    'commentsMain.update',
    'commentsMain.delete',
    
    // Follows
    'follows.toggleUser',
    'users.follow',
    
    // Bookmarks
    'bookmarks.toggleRestaurant',
    
    // Status updates
    'status.create',
    
    // Restaurant claims
    'restaurants.claims.submit',
    
    // User profile updates
    'auth.updateProfile',
    'users.updateProfile',
    
    // Messaging
    'messaging.sendMessage',
    'messaging.startConversation',
    'messaging.deleteMessage',
    'messaging.archiveConversation',
    'messaging.blockUser',
    'messaging.reportMessage',
    'messaging.addReaction',
    'messaging.removeReaction',
    'messaging.setTyping',
    'messaging.setOnlineStatus',
    'messaging.markAsRead',
    'messaging.bulkMarkAsRead',
    
    // Reservations
    'reservations.create',
    'reservations.update',
    
    // Events
    'events.attendEvent',
    'events.votePoll',
    'events.joinChallenge',
    
    // Gamification
    'gamification.claimReward',
    'gamification.joinChallenge',
    'gamification.updateProgress',
    
    // Notifications
    'notifications.markAsRead',
    'notifications.markAllAsRead',
    'notifications.delete',
    'notifications.updateSettings',
    'notifications.registerPushToken',
    
    // Support
    'support.createTicket',
    'support.addTicketResponse',
    
    // Subscriptions
    'subscriptions.subscribe',
    'subscriptions.cancel',
    'subscriptions.redeemReward',
    
    // Groups
    'groups.join',
    'groups.leave',
    'groups.create',
    'groups.createPost',
    
    // Discovery
    'discovery.dismissRecommendation',
    'discovery.saveSearchQuery',
    'discovery.clearSearchHistory',
    
    // Reputation
    'reputation.awardPoints',
    'reputation.updateTrustScore',
    
    // Loyalty
    'loyalty.awardPoints',
    'loyalty.redeemReward',
    
    // Image uploads
    'uploads.uploadImage',
    'uploads.deleteImage',
    
    // QR operations
    'qr.generate',
    'qr.trackScan',
    'qr.updateStatus',
    
    // Menu management
    'menu.createCategory',
    'menu.addDish'
  ];
  
  return writeOperations.some(op => procedurePath.includes(op));
}