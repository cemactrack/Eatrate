import { z } from "zod";
import { protectedProcedure, publicProcedure } from "@/backend/trpc/create-context";

const userFollowState = new Map<string, Set<string>>();
const restaurantFollowState = new Map<string, Set<string>>();
const userProfiles = new Map<string, {
  bio?: string;
  location?: { city: string; country: string; };
  badges: string[];
  joinedAt: string;
  preferences: {
    cuisines: string[];
    dietaryRestrictions: string[];
    priceRange: string[];
  };
}>();

// Initialize some sample data
if (userProfiles.size === 0) {
  userProfiles.set('temp_user_123', {
    bio: 'Food enthusiast exploring great flavors around the world 🍕🍜',
    location: { city: 'Douala', country: 'Cameroon' },
    badges: ['Foodie', 'Explorer', 'Reviewer'],
    joinedAt: new Date().toISOString(),
    preferences: {
      cuisines: ['Italian', 'Asian', 'Local'],
      dietaryRestrictions: [],
      priceRange: ['$$', '$$$']
    }
  });
}

export const toggleUserFollowProcedure = protectedProcedure
  .input(z.object({ targetUserId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    if (me === input.targetUserId) {
      return { following: false, followersCount: (userFollowState.get(input.targetUserId)?.size ?? 0) };
    }
    const set = userFollowState.get(input.targetUserId) ?? new Set<string>();
    const wasFollowing = set.has(me);
    if (wasFollowing) {
      set.delete(me);
    } else {
      set.add(me);
    }
    userFollowState.set(input.targetUserId, set);
    return { following: !wasFollowing, followersCount: set.size };
  });

export const getUserFollowStatsProcedure = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(({ input, ctx }) => {
    const followers = userFollowState.get(input.userId)?.size ?? 0;
    let following = 0;
    
    // Count how many users this user is following
    for (const [, followersSet] of userFollowState) {
      if (followersSet.has(input.userId)) {
        following++;
      }
    }
    
    const isFollowing = ctx.user ? userFollowState.get(input.userId)?.has(ctx.user.id) ?? false : false;
    
    return {
      followersCount: followers,
      followingCount: following,
      isFollowing
    };
  });

export const getFollowersProcedure = protectedProcedure
  .input(z.object({ 
    userId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(({ input }) => {
    const followersSet = userFollowState.get(input.userId) ?? new Set();
    const followers = Array.from(followersSet).slice(input.offset, input.offset + input.limit);
    
    return {
      followers: followers.map(id => ({
        id,
        username: `user_${id.slice(-6)}`,
        displayName: `User ${id.slice(-6)}`,
        avatar: `https://images.unsplash.com/photo-${Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000 + 1500000000000}?w=100&h=100&fit=crop&crop=faces`,
        isFollowing: userFollowState.get(id)?.has(input.userId) ?? false
      })),
      total: followersSet.size,
      hasMore: input.offset + input.limit < followersSet.size
    };
  });

export const getFollowingProcedure = protectedProcedure
  .input(z.object({ 
    userId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(({ input }) => {
    const following: string[] = [];
    
    // Find all users that this user is following
    for (const [targetUserId, followersSet] of userFollowState) {
      if (followersSet.has(input.userId)) {
        following.push(targetUserId);
      }
    }
    
    const paginatedFollowing = following.slice(input.offset, input.offset + input.limit);
    
    return {
      following: paginatedFollowing.map(id => ({
        id,
        username: `user_${id.slice(-6)}`,
        displayName: `User ${id.slice(-6)}`,
        avatar: `https://images.unsplash.com/photo-${Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000 + 1500000000000}?w=100&h=100&fit=crop&crop=faces`,
        isFollowing: true
      })),
      total: following.length,
      hasMore: input.offset + input.limit < following.length
    };
  });

export const updateUserProfileProcedure = protectedProcedure
  .input(z.object({
    bio: z.string().max(500).optional(),
    location: z.object({
      city: z.string().max(100),
      country: z.string().max(100)
    }).optional(),
    preferences: z.object({
      cuisines: z.array(z.string()).max(10),
      dietaryRestrictions: z.array(z.string()).max(10),
      priceRange: z.array(z.string()).max(4)
    }).optional()
  }))
  .mutation(({ input, ctx }) => {
    const userId = ctx.user!.id;
    const currentProfile = userProfiles.get(userId) ?? {
      badges: [],
      joinedAt: new Date().toISOString(),
      preferences: {
        cuisines: [],
        dietaryRestrictions: [],
        priceRange: []
      }
    };
    
    const updatedProfile = {
      ...currentProfile,
      ...input
    };
    
    userProfiles.set(userId, updatedProfile);
    
    return {
      success: true,
      profile: updatedProfile
    };
  });

export const getUserProfileProcedure = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(({ input }) => {
    const profile = userProfiles.get(input.userId);
    return profile ?? {
      bio: undefined,
      location: undefined,
      badges: [],
      joinedAt: new Date().toISOString(),
      preferences: {
        cuisines: [],
        dietaryRestrictions: [],
        priceRange: []
      }
    };
  });

export const awardBadgeProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    badge: z.string().max(50)
  }))
  .mutation(({ input }) => {
    const currentProfile = userProfiles.get(input.userId) ?? {
      badges: [],
      joinedAt: new Date().toISOString(),
      preferences: {
        cuisines: [],
        dietaryRestrictions: [],
        priceRange: []
      }
    };
    
    if (!currentProfile.badges.includes(input.badge)) {
      currentProfile.badges.push(input.badge);
      userProfiles.set(input.userId, currentProfile);
    }
    
    return {
      success: true,
      badges: currentProfile.badges
    };
  });

export const toggleRestaurantFollowProcedure = protectedProcedure
  .input(z.object({ restaurantId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    const set = restaurantFollowState.get(input.restaurantId) ?? new Set<string>();
    if (set.has(me)) set.delete(me); else set.add(me);
    restaurantFollowState.set(input.restaurantId, set);
    return { following: set.has(me), followersCount: set.size };
  });