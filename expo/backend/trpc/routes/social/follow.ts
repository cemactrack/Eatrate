import { z } from "zod";
import { protectedProcedure, publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";



export const toggleUserFollowProcedure = protectedProcedure
  .input(z.object({ targetUserId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const me = ctx.user!.id;
    if (me === input.targetUserId) {
      return { following: false, followersCount: 0 };
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Check if already following
      const { data: existingFollow } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', me)
        .eq('following_id', input.targetUserId)
        .single();

      let following: boolean;
      if (existingFollow) {
        // Unfollow
        await supabaseAdmin
          .from('follows')
          .delete()
          .eq('follower_id', me)
          .eq('following_id', input.targetUserId);
        following = false;
      } else {
        // Follow
        await supabaseAdmin
          .from('follows')
          .insert({
            follower_id: me,
            following_id: input.targetUserId,
          });
        following = true;
      }

      // Get updated followers count
      const { count: followersCount } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', input.targetUserId);

      return { following, followersCount: followersCount || 0 };
    } catch (error) {
      console.error('[tRPC] toggleUserFollow error', error);
      throw new Error('Failed to toggle follow');
    }
  });

export const getUserFollowStatsProcedure = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Get followers count
      const { count: followersCount } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', input.userId);

      // Get following count
      const { count: followingCount } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', input.userId);

      // Check if current user is following this user
      let isFollowing = false;
      if (ctx.user) {
        const { data: followRecord } = await supabaseAdmin
          .from('follows')
          .select('id')
          .eq('follower_id', ctx.user.id)
          .eq('following_id', input.userId)
          .single();
        isFollowing = !!followRecord;
      }

      return {
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing
      };
    } catch (error) {
      console.error('[tRPC] getUserFollowStats error', error);
      return {
        followersCount: 0,
        followingCount: 0,
        isFollowing: false
      };
    }
  });

export const getFollowersProcedure = protectedProcedure
  .input(z.object({ 
    userId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const { data: followers, error, count } = await supabaseAdmin
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            display_name,
            avatar_url,
            bio
          )
        `, { count: 'exact' })
        .eq('following_id', input.userId)
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        console.error('[tRPC] getFollowers error', error);
        return { followers: [], total: 0, hasMore: false };
      }

      const mapped = (followers || []).map((f) => {
        const profile = f.profiles;
        return {
          id: f.follower_id,
          username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${f.follower_id.slice(-6)}`,
          displayName: profile?.display_name || `User ${f.follower_id.slice(-6)}`,
          avatar: profile?.avatar_url || `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop`,
          isFollowing: false // TODO: Check if input.userId is following this user back
        };
      });

      return {
        followers: mapped,
        total: count || 0,
        hasMore: input.offset + input.limit < (count || 0)
      };
    } catch (error) {
      console.error('[tRPC] getFollowers error', error);
      return { followers: [], total: 0, hasMore: false };
    }
  });

export const getFollowingProcedure = protectedProcedure
  .input(z.object({ 
    userId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const { data: following, error, count } = await supabaseAdmin
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            display_name,
            avatar_url,
            bio
          )
        `, { count: 'exact' })
        .eq('follower_id', input.userId)
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        console.error('[tRPC] getFollowing error', error);
        return { following: [], total: 0, hasMore: false };
      }

      const mapped = (following || []).map((f) => {
        const profile = f.profiles;
        return {
          id: f.following_id,
          username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${f.following_id.slice(-6)}`,
          displayName: profile?.display_name || `User ${f.following_id.slice(-6)}`,
          avatar: profile?.avatar_url || `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop`,
          isFollowing: true
        };
      });

      return {
        following: mapped,
        total: count || 0,
        hasMore: input.offset + input.limit < (count || 0)
      };
    } catch (error) {
      console.error('[tRPC] getFollowing error', error);
      return { following: [], total: 0, hasMore: false };
    }
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
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.user!.id;
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const updateData: any = {};
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.preferences !== undefined) updateData.preferences = input.preferences;

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] updateUserProfile error', error);
        throw new Error('Failed to update profile');
      }

      return {
        success: true,
        profile: {
          bio: profile.bio,
          location: profile.location,
          badges: profile.badges || [],
          joinedAt: profile.created_at,
          preferences: profile.preferences || {
            cuisines: [],
            dietaryRestrictions: [],
            priceRange: []
          }
        }
      };
    } catch (error) {
      console.error('[tRPC] updateUserProfile error', error);
      throw new Error('Failed to update profile');
    }
  });

export const getUserProfileProcedure = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', input.userId)
        .single();

      if (error) {
        console.error('[tRPC] getUserProfile error', error);
        return {
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
      }

      return {
        bio: profile.bio,
        location: profile.location,
        badges: profile.badges || [],
        joinedAt: profile.created_at,
        preferences: profile.preferences || {
          cuisines: [],
          dietaryRestrictions: [],
          priceRange: []
        }
      };
    } catch (error) {
      console.error('[tRPC] getUserProfile error', error);
      return {
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
    }
  });

export const awardBadgeProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    badge: z.string().max(50)
  }))
  .mutation(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Get current profile
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('badges')
        .eq('id', input.userId)
        .single();

      if (fetchError) {
        console.error('[tRPC] awardBadge fetch error', fetchError);
        throw new Error('Failed to fetch profile');
      }

      const currentBadges = profile.badges || [];
      if (!currentBadges.includes(input.badge)) {
        const updatedBadges = [...currentBadges, input.badge];
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ badges: updatedBadges })
          .eq('id', input.userId);

        if (updateError) {
          console.error('[tRPC] awardBadge update error', updateError);
          throw new Error('Failed to award badge');
        }

        return {
          success: true,
          badges: updatedBadges
        };
      }

      return {
        success: true,
        badges: currentBadges
      };
    } catch (error) {
      console.error('[tRPC] awardBadge error', error);
      throw new Error('Failed to award badge');
    }
  });

export const toggleRestaurantFollowProcedure = protectedProcedure
  .input(z.object({ restaurantId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const me = ctx.user!.id;
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Check if already following
      const { data: existingBookmark } = await supabaseAdmin
        .from('bookmarks')
        .select('id')
        .eq('user_id', me)
        .eq('restaurant_id', input.restaurantId)
        .single();

      let following: boolean;
      if (existingBookmark) {
        // Unfollow (remove bookmark)
        await supabaseAdmin
          .from('bookmarks')
          .delete()
          .eq('user_id', me)
          .eq('restaurant_id', input.restaurantId);
        following = false;
      } else {
        // Follow (add bookmark)
        await supabaseAdmin
          .from('bookmarks')
          .insert({
            user_id: me,
            restaurant_id: input.restaurantId,
          });
        following = true;
      }

      // Get updated followers count
      const { count: followersCount } = await supabaseAdmin
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', input.restaurantId);

      return { following, followersCount: followersCount || 0 };
    } catch (error) {
      console.error('[tRPC] toggleRestaurantFollow error', error);
      throw new Error('Failed to toggle restaurant follow');
    }
  });