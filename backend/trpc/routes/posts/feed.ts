import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { supabaseAdmin } from "@/backend/supabase-admin";

// Real-time events emitter
const feedEvents = new EventEmitter();

// Emit post updates
export const emitPostUpdate = (postId: string, update: { likesCount?: number; commentsCount?: number; isLiked?: boolean }) => {
  feedEvents.emit('postUpdate', { postId, update });
};

export const emitNewPost = (post: any) => {
  feedEvents.emit('newPost', post);
};

function avatarFor(id: number): string {
  const pool = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  ];
  return pool[id % pool.length] ?? pool[0];
}

export const getPostFeedProcedure = publicProcedure
  .input(z.object({
    type: z.enum(['trending', 'recent', 'following', 'local']).default('recent'),
    category: z.enum(['all', 'review', 'photo', 'video', 'story']).default('all'),
    location: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
  }))
  .query(async ({ input, ctx }) => {
    console.log('[tRPC] getPostFeedProcedure called with:', input);
    
    try {
      if (!supabaseAdmin) {
        console.error('[tRPC] Supabase admin client not configured');
        throw new Error('Database not available');
      }

      const offset = input.cursor ? parseInt(input.cursor) : 0;
      const actualLimit = Math.min(input.limit, 50);

      // Build query based on type
      // Note: Only select columns that exist in the actual table
      let query = supabaseAdmin
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `, { count: 'exact' })
        .range(offset, offset + actualLimit - 1);

      // Apply filters based on type
      if (input.type === 'trending') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply category filter
      if (input.category !== 'all') {
        query = query.eq('type', input.category);
      }

      const { data: posts, error: postsError, count } = await query;

      if (postsError) {
        console.error('[tRPC] posts feed error', postsError);
        throw new Error('Failed to fetch posts');
      }

      // Map posts to expected format
      // Note: Actual schema only has: user_id, text, type, created_at
      const mappedPosts = (posts || []).map((p: any) => {
        const profile = p.profiles;
        return {
          id: p.id || p.user_id, // Fallback if id doesn't exist
          userId: p.user_id,
          user: {
            id: p.user_id,
            username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${p.user_id?.slice(-6) || 'unknown'}`,
            displayName: profile?.display_name || `User ${p.user_id?.slice(-6) || 'Unknown'}`,
            avatar: profile?.avatar_url || avatarFor(parseInt(p.user_id?.slice(-6) || '0', 36) || 0),
            bio: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            badges: [],
            preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
          },
          type: (p.type || 'review') as 'review' | 'photo' | 'video' | 'story',
          content: {
            text: p.text || '',
            images: [],
            videos: [],
          },
          restaurant: undefined,
          dish: undefined,
          ratings: {
            food: 0,
            service: 0,
            ambiance: 0,
            cleanliness: 0,
            overall: 0,
          },
          tags: [],
          location: undefined,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: p.created_at,
          updatedAt: p.created_at,
        };
      });

      const hasMore = (posts?.length || 0) >= actualLimit;
      const nextCursor = hasMore ? String(offset + actualLimit) : undefined;

      return {
        posts: mappedPosts,
        total: count || mappedPosts.length,
        hasMore,
        nextCursor,
        type: input.type,
        category: input.category,
      };
    } catch (error: any) {
      console.error('[tRPC] getPostFeedProcedure error:', error);
      // Return empty feed instead of throwing to prevent UI errors
      return {
        posts: [],
        total: 0,
        hasMore: false,
        nextCursor: undefined,
        type: input.type,
        category: input.category,
      };
    }
  });

export const getPostDetailsProcedure = publicProcedure
  .input(z.object({ postId: z.string() }))
  .query(async ({ input }) => {
    const postId = parseInt(input.postId) || 1;
    
    // Mock detailed post data
    const post = {
      id: input.postId,
      userId: String((postId % 10) + 1),
      user: {
        id: String((postId % 10) + 1),
        username: `foodie_${(postId % 10) + 1}`,
        displayName: `Food Lover ${(postId % 10) + 1}`,
        avatar: `https://images.unsplash.com/photo-${1494790108755 + (postId % 10)}?w=200&h=200&fit=crop`,
        bio: 'Passionate about great food and experiences. Love exploring new cuisines and sharing my discoveries!',
        followersCount: 1500 + (postId % 1000),
        followingCount: 250 + (postId % 500),
        postsCount: 45 + (postId % 100),
        badges: postId % 5 === 0 ? ['Top Reviewer', 'Local Guide'] : postId % 3 === 0 ? ['Verified Foodie'] : [],
        preferences: { 
          cuisines: ['Italian', 'Asian', 'African'], 
          dietaryRestrictions: postId % 7 === 0 ? ['Vegetarian'] : [], 
          priceRange: ['$$', '$$$'] 
        },
        isFollowing: postId % 6 === 0,
      },
      type: 'review' as const,
      content: {
        text: `Had an absolutely incredible dining experience here! Post ${postId}. The attention to detail in every dish was remarkable. The chef clearly knows how to balance flavors perfectly. The ambiance was cozy yet elegant, perfect for both casual dining and special occasions. Service was attentive without being intrusive. Will definitely be coming back soon! 

#foodie #restaurant #delicious #recommended`,
        images: [
          `https://picsum.photos/seed/food${postId}/800/600`,
          `https://picsum.photos/seed/food${postId}b/800/600`,
          `https://picsum.photos/seed/food${postId}c/800/600`,
        ],
        videos: postId % 5 === 0 ? [`https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`] : [],
      },
      restaurant: {
        id: String((postId % 20) + 1),
        name: `Gourmet Restaurant ${(postId % 20) + 1}`,
        location: ['Douala Central', 'Yaoundé Downtown', 'Buea Town', 'Limbe Beach'][postId % 4],
      },
      dish: {
        id: String((postId % 30) + 1),
        name: `Signature Dish ${(postId % 30) + 1}`,
      },
      ratings: {
        food: 4 + (postId % 2),
        service: 4 + ((postId + 1) % 2),
        ambiance: 4 + ((postId + 2) % 2),
        cleanliness: 5,
        overall: 4.2 + ((postId % 3) * 0.3),
      },
      tags: [
        'amazing',
        'must-try',
        ['italian', 'asian', 'african', 'french'][postId % 4],
        'recommended',
        'fine-dining',
      ],
      location: {
        latitude: 4.0511 + (postId % 100) * 0.001,
        longitude: 9.7679 + (postId % 100) * 0.001,
        address: `${postId} Gourmet Street, Douala, Cameroon`,
      },
      likesCount: 125 + (postId % 200),
      commentsCount: 18 + (postId % 50),
      sharesCount: 8 + (postId % 20),
      viewsCount: 850 + (postId % 500),
      isLiked: postId % 7 === 0,
      isBookmarked: postId % 11 === 0,
      createdAt: new Date(Date.now() - postId * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - postId * 3600000).toISOString(),
      
      // Additional details for post detail view
      engagement: {
        likesList: Array.from({ length: Math.min(10, 125 + (postId % 200)) }, (_, i) => ({
          id: String(i + 1),
          username: `user_${i + 1}`,
          displayName: `User ${i + 1}`,
          avatar: `https://images.unsplash.com/photo-${1494790108755 + i}?w=100&h=100&fit=crop`,
        })),
        topComments: Array.from({ length: Math.min(3, 18 + (postId % 50)) }, (_, i) => ({
          id: String(i + 1),
          user: {
            id: String(i + 1),
            username: `commenter_${i + 1}`,
            displayName: `Commenter ${i + 1}`,
            avatar: `https://images.unsplash.com/photo-${1494790108755 + i + 10}?w=100&h=100&fit=crop`,
          },
          text: `Great review! I've been wanting to try this place. Comment ${i + 1}`,
          likesCount: 5 + (i % 10),
          isLiked: i % 3 === 0,
          createdAt: new Date(Date.now() - (i + 1) * 1800000).toISOString(),
        })),
      },
      
      // Related posts
      relatedPosts: Array.from({ length: 3 }, (_, i) => ({
        id: String(postId + i + 100),
        user: {
          displayName: `Related User ${i + 1}`,
          avatar: `https://images.unsplash.com/photo-${1494790108755 + i + 20}?w=100&h=100&fit=crop`,
        },
        content: {
          text: `Related post ${i + 1} about similar cuisine...`,
          images: [`https://picsum.photos/seed/related${i}/400/300`],
        },
        ratings: { overall: 4 + (i % 2) },
        likesCount: 50 + (i * 10),
        createdAt: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
      })),
    };

    return { post };
  });

// Real-time subscription for post updates
export const subscribeToPostUpdatesProcedure = protectedProcedure
  .input(z.object({ postId: z.string().optional() }))
  .subscription(({ input }) => {
    return observable<{ type: 'update' | 'new'; postId?: string; post?: any; update?: any }>((emit) => {
      const onPostUpdate = (data: { postId: string; update: any }) => {
        if (!input.postId || data.postId === input.postId) {
          emit.next({ type: 'update', postId: data.postId, update: data.update });
        }
      };
      
      const onNewPost = (post: any) => {
        emit.next({ type: 'new', post });
      };
      
      feedEvents.on('postUpdate', onPostUpdate);
      feedEvents.on('newPost', onNewPost);
      
      return () => {
        feedEvents.off('postUpdate', onPostUpdate);
        feedEvents.off('newPost', onNewPost);
      };
    });
  });

// Real-time feed subscription
export const subscribeToFeedProcedure = protectedProcedure
  .input(z.object({ 
    type: z.enum(['recent', 'trending', 'following', 'local']).default('recent')
  }))
  .subscription(({ input }) => {
    return observable<{ type: 'update' | 'new'; data: any }>((emit) => {
      const onPostUpdate = (data: { postId: string; update: any }) => {
        emit.next({ type: 'update', data });
      };
      
      const onNewPost = (post: any) => {
        // Filter based on feed type
        let shouldInclude = true;
        
        switch (input.type) {
          case 'trending':
            shouldInclude = post.likesCount > 10;
            break;
          case 'following':
            // In a real app, check if user follows the post author
            shouldInclude = Math.random() > 0.5;
            break;
          case 'local':
            shouldInclude = !!post.location;
            break;
          default:
            shouldInclude = true;
        }
        
        if (shouldInclude) {
          emit.next({ type: 'new', data: post });
        }
      };
      
      feedEvents.on('postUpdate', onPostUpdate);
      feedEvents.on('newPost', onNewPost);
      
      return () => {
        feedEvents.off('postUpdate', onPostUpdate);
        feedEvents.off('newPost', onNewPost);
      };
    });
  });
