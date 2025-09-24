import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";

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
    const [postsRes, usersRes] = await Promise.all([
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=20'),
      fetch('https://jsonplaceholder.typicode.com/users'),
    ]);

    if (!postsRes.ok || !usersRes.ok) throw new Error('Failed to fetch posts/users');

    const posts = (await postsRes.json()) as Array<{ id: number; userId: number; title: string; body: string }>;
    const users = (await usersRes.json()) as Array<any>;

    const usersById = new Map<number, any>();
    users.forEach((u) => usersById.set(u.id, u));

    const mapped = posts.map((p) => {
      const u = usersById.get(p.userId);
      const uid = String(u?.id ?? p.userId);
      const displayName = String(u?.name ?? `User ${uid}`);
      const username = String(u?.username ?? `user_${uid}`);
      return {
        id: String(p.id),
        userId: uid,
        user: {
          id: uid,
          username,
          displayName,
          avatar: avatarFor(Number(uid)),
          bio: `${displayName} from ${u?.address?.city ?? 'somewhere'}`,
          followersCount: 100 + (p.id % 900),
          followingCount: 50 + (p.id % 300),
          postsCount: 1 + (p.id % 50),
          badges: [],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        type: 'review' as const,
        content: {
          text: p.body,
          images: [`https://picsum.photos/seed/post${p.id}/800/600`],
        },
        restaurant: undefined,
        ratings: {
          food: 3 + (p.id % 3),
          service: 3 + ((p.id + 1) % 3),
          ambiance: 3 + ((p.id + 2) % 3),
          cleanliness: 3 + ((p.id + 3) % 3),
          overall: 4,
        },
        tags: ['live', 'feed'],
        likesCount: (p.id * 7) % 100,
        commentsCount: (p.id * 5) % 40,
        sharesCount: (p.id * 3) % 20,
        isLiked: false,
        createdAt: new Date(Date.now() - p.id * 3600_000).toISOString(),
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
    console.log('[tRPC] Creating post (live API):', input);
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.text.slice(0, 40),
          body: input.text,
          userId: ctx.user?.id || 'anonymous',
        }),
      });
      const json = await res.json();
      return { id: String(json.id ?? Date.now()) };
    } catch (e) {
      console.log('[tRPC] create post failed', e);
      return { id: String(Date.now()) };
    }
  });

export const createStatusProcedure = protectedProcedure
  .input(z.object({
    text: z.string().max(240).optional(),
    image: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating status (live API):', input);
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (input.text ?? '').slice(0, 40),
          body: input.text ?? '',
          userId: ctx.user?.id || 'anonymous',
        }),
      });
      const json = await res.json();
      return { id: String(json.id ?? Date.now()) };
    } catch (e) {
      console.log('[tRPC] create status failed', e);
      return { id: String(Date.now()) };
    }
  });

export const getRestaurantsProcedure = publicProcedure.query(async () => {
  try {
    const res = await fetch('https://world.openfoodfacts.org/api/v2/search?categories_tags_en=restaurants&page_size=10');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const restaurants = (data.products ?? []).map((p: any, idx: number) => ({
      id: String(p.id ?? idx),
      name: String(p.brands ?? p.product_name ?? 'Restaurant'),
      cuisine: 'International',
      rating: 4,
      reviewCount: 0,
      image: p.image_url ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      address: String(p.countries ?? 'Cameroon'),
      priceRange: '$' as const,
      isOpen: true,
      tags: [],
    }));
    return { restaurants, message: 'Restaurants fetched successfully' };
  } catch (e) {
    return { restaurants: [], message: 'Failed to fetch restaurants' };
  }
});

export const getCommentsProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${encodeURIComponent(input.postId)}`);
      const items = res.ok ? ((await res.json()) as Array<{ id: number; name: string; email: string; body: string }>) : [];
      const comments = items.slice(0, 20).map((c) => ({
        id: String(c.id),
        postId: input.postId,
        userId: String(c.id),
        user: {
          id: String(c.id),
          username: c.email.split('@')[0],
          displayName: c.name,
          avatar: avatarFor(c.id),
          bio: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          badges: [],
          preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
        },
        text: c.body,
        likesCount: c.id % 10,
        isLiked: false,
        createdAt: new Date(Date.now() - c.id * 1800_000).toISOString(),
      }));
      return { comments, postId: input.postId, message: 'Comments fetched successfully' };
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
    console.log('[tRPC] Creating comment (live API):', input);
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: input.postId,
          body: input.text,
          email: `${ctx.user?.id ?? 'anonymous'}@example.com`,
          name: 'comment',
        }),
      });
      const json = await res.json();
      return { id: String(json.id ?? Date.now()) };
    } catch (e) {
      console.log('[tRPC] create comment failed', e);
      return { id: String(Date.now()) };
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
    const res = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const items = await res.json();
    const users = (items as Array<any>).map((u: any) => ({
      id: String(u.id),
      username: String(u.username),
      displayName: String(u.name),
      avatar: avatarFor(Number(u.id)),
      bio: `${u.company?.catchPhrase ?? ''}`,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      badges: [],
      preferences: { cuisines: [], dietaryRestrictions: [], priceRange: [] },
    }));
    return { users, message: 'Users fetched successfully' };
  } catch (e: any) {
    console.log('[tRPC] users.list error', e?.message ?? e);
    return { users: [], message: 'Failed to fetch users' };
  }
});

export default hiProcedure;
export { createStatusProcedure };