import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";

export const hiProcedure = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });

function avatarFor(id: number): string {
  const pool = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  ];
  return pool[id % pool.length] ?? pool[0];
}

export const getPostsProcedure = publicProcedure.query(async () => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsError) {
      console.error('[tRPC] posts.list error', postsError);
      return { posts: [], message: 'Failed to fetch posts' };
    }

    const mapped = (posts || []).map((p: any) => {
      const profile = p.profiles;
      return {
        id: p.id || p.user_id,
        userId: p.user_id,
        user: {
          id: p.user_id,
          username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${p.user_id.slice(-6)}`,
          displayName: profile?.display_name || `User ${p.user_id.slice(-6)}`,
          avatar: profile?.avatar_url || avatarFor(parseInt(p.user_id.slice(-6), 36) || 0),
          bio: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          badges: [],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        type: p.type || 'review' as const,
        content: {
          text: p.text || '',
          images: [],
        },
        restaurant: undefined,
        ratings: {
          food: 0,
          service: 0,
          ambiance: 0,
          cleanliness: 0,
          overall: 0,
        },
        tags: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        createdAt: p.created_at,
      };
    });

    return { posts: mapped, message: 'Posts fetched successfully' };
  } catch (e: any) {
    console.log('[tRPC] posts.list error', e?.message ?? e);
    return { posts: [], message: 'Failed to fetch posts' };
  }
});

export const createPostProcedure = protectedProcedure
  .input(z.object({
    text: z.string().min(1).max(500),
    restaurantId: z.string().optional(),
    images: z.array(z.string()).optional(),
    ratings: z.object({
      food: z.number().min(1).max(5),
      service: z.number().min(1).max(5),
      ambiance: z.number().min(1).max(5),
      cleanliness: z.number().min(1).max(5),
    }),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating post:', input);
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      // Note: Actual schema only has: user_id, text, type, created_at
      const { data: post, error } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: ctx.user!.id,
          text: input.text,
          type: 'review',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[tRPC] create post error', error);
        throw new Error('Failed to create post');
      }

      return { id: post.id };
    } catch (e: any) {
      console.log('[tRPC] create post failed', e?.message ?? e);
      throw new Error('Failed to create post');
    }
  });

export const createStatusProcedure = protectedProcedure
  .input(z.object({
    text: z.string().max(240).optional(),
    image: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating status:', input);
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      // Note: Actual schema only has: user_id, text, type, created_at
      const { data: post, error } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: ctx.user!.id,
          text: input.text || '',
          type: 'story',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[tRPC] create status error', error);
        throw new Error('Failed to create status');
      }

      return { id: post.id };
    } catch (e: any) {
      console.log('[tRPC] create status failed', e?.message ?? e);
      throw new Error('Failed to create status');
    }
  });

export const getRestaurantsProcedure = publicProcedure.query(async () => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    const { data: restaurants, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[tRPC] restaurants.list error', error);
      return { restaurants: [], message: 'Failed to fetch restaurants' };
    }

    const mapped = (restaurants || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine || 'International',
      rating: r.rating || 0,
      reviewCount: r.review_count || 0,
      image: r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      address: r.address || '',
      city: r.city || '',
      priceRange: r.price_range || '$' as const,
      isOpen: r.is_open ?? true,
      tags: r.tags || [],
      verified: r.verified ?? false,
      claimed: r.claimed ?? false,
    }));

    return { restaurants: mapped, message: 'Restaurants fetched successfully' };
  } catch (e: any) {
    console.error('[tRPC] restaurants.list error', e?.message ?? e);
    return { restaurants: [], message: 'Failed to fetch restaurants' };
  }
});

export const getCommentsProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      const { data: comments, error } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', input.postId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('[tRPC] comments.list error', error);
        return { comments: [], postId: input.postId, message: 'Failed to fetch comments' };
      }

      const mapped = (comments || []).map((c) => {
        const profile = c.profiles;
        return {
          id: c.id,
          postId: input.postId,
          userId: c.user_id,
          user: {
            id: c.user_id,
            username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${c.user_id.slice(-6)}`,
            displayName: profile?.display_name || `User ${c.user_id.slice(-6)}`,
            avatar: profile?.avatar_url || avatarFor(parseInt(c.user_id.slice(-6), 36) || 0),
            bio: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            badges: [],
            preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
          },
          text: c.content,
          likesCount: c.likes_count || 0,
          isLiked: false, // TODO: Check if current user liked this comment
          createdAt: c.created_at,
        };
      });

      return { comments: mapped, postId: input.postId, message: 'Comments fetched successfully' };
    } catch (e: any) {
      console.log('[tRPC] comments.list error', e?.message ?? e);
      return { comments: [], postId: input.postId, message: 'Failed to fetch comments' };
    }
  });

export const createCommentProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(),
    text: z.string().min(1).max(240),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating comment:', input);
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      const { data: comment, error } = await supabaseAdmin
        .from('comments')
        .insert({
          post_id: input.postId,
          user_id: ctx.user!.id,
          content: input.text,
          likes_count: 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[tRPC] create comment error', error);
        throw new Error('Failed to create comment');
      }

      // Update post comments count
      await supabaseAdmin
        .rpc('increment_post_comments', { post_id: input.postId });

      return { id: comment.id };
    } catch (e: any) {
      console.log('[tRPC] create comment failed', e?.message ?? e);
      throw new Error('Failed to create comment');
    }
  });

export const getDishesProcedure = publicProcedure.query(async () => {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
    if (!res.ok) throw new Error('Failed to fetch meals');
    const data = await res.json();
    const dishes = (data.meals ?? []).slice(0, 20).map((m: any) => ({
      id: String(m.idMeal),
      name: String(m.strMeal),
      restaurant: String(m.strArea ?? 'Unknown'),
      rating: 4,
      reviewCount: 0,
      image: String(m.strMealThumb),
      price: 0,
      description: String(m.strInstructions ?? ''),
      category: String(m.strCategory ?? 'Meal'),
      tags: (String(m.strTags ?? '').split(',').filter(Boolean) as string[]) ?? [],
    }));
    return { dishes, message: 'Dishes fetched successfully' };
  } catch (e: any) {
    console.log('[tRPC] dishes.list error', e?.message ?? e);
    return { dishes: [], message: 'Failed to fetch dishes' };
  }
});

export const getUsersProcedure = publicProcedure.query(async () => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[tRPC] users.list error', error);
      return { users: [], message: 'Failed to fetch users' };
    }

    const users = (profiles || []).map((p) => ({
      id: p.id,
      username: p.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${p.id.slice(-6)}`,
      displayName: p.display_name || `User ${p.id.slice(-6)}`,
      avatar: p.avatar_url || avatarFor(parseInt(p.id.slice(-6), 36) || 0),
      bio: '',
      followersCount: 0, // TODO: Calculate from follows table
      followingCount: 0, // TODO: Calculate from follows table
      postsCount: 0, // TODO: Calculate from posts table
      badges: p.badges || [],
      preferences: p.preferences || { cuisines: [], dietaryRestrictions: [], priceRange: [] },
    }));

    return { users, message: 'Users fetched successfully' };
  } catch (e: any) {
    console.log('[tRPC] users.list error', e?.message ?? e);
    return { users: [], message: 'Failed to fetch users' };
  }
});

export default hiProcedure;