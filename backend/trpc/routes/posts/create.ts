import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";

const MAX_POST_TEXT_LENGTH = 500;
const MAX_IMAGES_COUNT = 5;

const nutritionEstimateSchema = z.object({
  totalCalories: z.number().nonnegative(),
  items: z.array(z.object({
    name: z.string(),
    calories: z.number().nonnegative(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  confidence: z.number().min(0).max(1),
});

export const createPostProcedure = protectedProcedure
  .input(z.object({
    text: z.string().min(1).max(MAX_POST_TEXT_LENGTH),
    restaurantId: z.string().optional(),
    images: z.array(z.string()).max(MAX_IMAGES_COUNT).optional(),
    videos: z.array(z.string()).optional(),
    ratings: z.object({
      food: z.number().min(1).max(5),
      service: z.number().min(1).max(5),
      ambiance: z.number().min(1).max(5),
      cleanliness: z.number().min(1).max(5),
    }),
    tags: z.array(z.string()).optional(),
    category: z.enum(['review', 'photo', 'video', 'story']).default('review'),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    }).optional(),
    scheduledFor: z.string().optional(), // ISO date string
    isDraft: z.boolean().default(false),
    nutritionEstimate: nutritionEstimateSchema.optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const startTime = Date.now();
    console.log('[tRPC] Creating post:', { textLength: input.text.length, imagesCount: input.images?.length || 0 });
    
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      // Validate input
      if (!input.text?.trim() && (!input.images || input.images.length === 0)) {
        throw new Error('Post must contain text or images');
      }
      
      // Validate ratings
      const { food, service, ambiance, cleanliness } = input.ratings;
      if ([food, service, ambiance, cleanliness].some(rating => rating < 1 || rating > 5)) {
        throw new Error('All ratings must be between 1 and 5');
      }
      
      const overall = Math.round((input.ratings.food * 0.4 + input.ratings.service * 0.3 + input.ratings.ambiance * 0.2 + input.ratings.cleanliness * 0.1) * 10) / 10;
      const status = input.isDraft ? 'draft' : (input.scheduledFor ? 'scheduled' : 'published');
      
      const { data: post, error } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: ctx.user!.id,
          content: input.text,
          restaurant_id: input.restaurantId || null,
          images: input.images || [],
          videos: input.videos || [],
          rating_food: input.ratings.food,
          rating_service: input.ratings.service,
          rating_ambiance: input.ratings.ambiance,
          rating_cleanliness: input.ratings.cleanliness,
          rating_overall: overall,
          tags: input.tags || [],
          type: input.category,
          status,
          location: input.location,
          scheduled_for: input.scheduledFor || null,
          nutrition_estimate: input.nutritionEstimate || null,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[tRPC] create post error', error);
        throw new Error('Failed to create post');
      }
      
      const processingTime = Date.now() - startTime;
      console.log('[tRPC] Post created successfully:', post.id, `(${processingTime}ms)`);
      
      return { 
        id: post.id, 
        status,
        message: input.isDraft ? 'Draft saved' : (input.scheduledFor ? 'Post scheduled' : 'Post created successfully')
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[tRPC] Failed to save post:', error, `(${processingTime}ms)`);
      throw new Error('Failed to save post. Please try again.');
    }
  });

export const updatePostProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(),
    text: z.string().min(1).max(500).optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    scheduledFor: z.string().optional(),
    isDraft: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Check if post exists and user owns it
      const { data: existingPost, error: fetchError } = await supabaseAdmin
        .from('posts')
        .select('user_id')
        .eq('id', input.postId)
        .single();

      if (fetchError || !existingPost) {
        throw new Error('Post not found');
      }
      
      if (existingPost.user_id !== ctx.user?.id) {
        throw new Error('Unauthorized');
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (input.text !== undefined) updateData.content = input.text;
      if (input.images !== undefined) updateData.images = input.images;
      if (input.videos !== undefined) updateData.videos = input.videos;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.scheduledFor !== undefined) updateData.scheduled_for = input.scheduledFor;
      if (input.isDraft !== undefined) {
        updateData.status = input.isDraft ? 'draft' : 'published';
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update(updateData)
        .eq('id', input.postId);

      if (updateError) {
        console.error('[tRPC] update post error', updateError);
        throw new Error('Failed to update post');
      }
      
      return { 
        id: input.postId, 
        message: 'Post updated successfully' 
      };
    } catch (error) {
      console.error('[tRPC] updatePost error', error);
      throw new Error('Failed to update post');
    }
  });

export const deletePostProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Check if post exists and user owns it
      const { data: existingPost, error: fetchError } = await supabaseAdmin
        .from('posts')
        .select('user_id')
        .eq('id', input.postId)
        .single();

      if (fetchError || !existingPost) {
        throw new Error('Post not found');
      }
      
      if (existingPost.user_id !== ctx.user?.id) {
        throw new Error('Unauthorized');
      }
      
      const { error: deleteError } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', input.postId);

      if (deleteError) {
        console.error('[tRPC] delete post error', deleteError);
        throw new Error('Failed to delete post');
      }
      
      return { 
        id: input.postId, 
        message: 'Post deleted successfully' 
      };
    } catch (error) {
      console.error('[tRPC] deletePost error', error);
      throw new Error('Failed to delete post');
    }
  });

export const getUserPostsProcedure = protectedProcedure
  .input(z.object({
    userId: z.string().optional(),
    status: z.enum(['all', 'published', 'draft', 'scheduled']).default('published'),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const targetUserId = input.userId || ctx.user?.id;
      
      let query = supabaseAdmin
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            display_name,
            avatar_url,
            bio
          ),
          restaurants (
            id,
            name,
            address
          )
        `, { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      const { data: posts, error, count } = await query;

      if (error) {
        console.error('[tRPC] getUserPosts error', error);
        return { posts: [], total: 0, hasMore: false };
      }
      
      const mapped = (posts || []).map((p) => {
        const profile = p.profiles;
        return {
          id: p.id,
          userId: p.user_id,
          user: {
            id: p.user_id,
            username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${p.user_id.slice(-6)}`,
            displayName: profile?.display_name || `User ${p.user_id.slice(-6)}`,
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
            bio: profile?.bio || '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            badges: [],
            preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
          },
          type: p.type || 'review',
          content: {
            text: p.content || '',
            images: p.images || [],
            videos: p.videos || [],
          },
          restaurant: p.restaurants ? {
            id: p.restaurants.id,
            name: p.restaurants.name,
            location: p.restaurants.address,
          } : undefined,
          ratings: {
            food: p.rating_food || 0,
            service: p.rating_service || 0,
            ambiance: p.rating_ambiance || 0,
            cleanliness: p.rating_cleanliness || 0,
            overall: p.rating_overall || 0,
          },
          nutritionEstimate: p.nutrition_estimate,
          tags: p.tags || [],
          location: p.location,
          likesCount: p.likes_count || 0,
          commentsCount: p.comments_count || 0,
          sharesCount: p.shares_count || 0,
          viewsCount: p.views_count || 0,
          isLiked: false, // TODO: Check if current user liked this post
          isBookmarked: false, // TODO: Check if current user bookmarked this post
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          scheduledFor: p.scheduled_for,
          isDraft: p.status === 'draft',
          status: p.status,
        };
      });
      
      return {
        posts: mapped,
        total: count || 0,
        hasMore: input.offset + input.limit < (count || 0),
      };
    } catch (error) {
      console.error('[tRPC] getUserPosts error', error);
      return { posts: [], total: 0, hasMore: false };
    }
  });