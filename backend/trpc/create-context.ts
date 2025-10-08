import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";
// Initialize Supabase client with server-side credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client for server-side operations using the service key
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
        },
      },
    })
  : null;

// Create a Supabase client with anon key as fallback (less privileged)
const supabaseClient = supabaseUrl && supabaseAnonKey && !supabaseAdmin
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'apikey': supabaseAnonKey,
        },
      },
    })
  : null;

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  let user: {
    id: string;
    email?: string | null;
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
  } | null = null;

  try {
    const authHeader = opts.req.headers.get('authorization') || '';
    const bearerPrefix = 'bearer ';
    let accessToken = '';

    if (authHeader.toLowerCase().startsWith(bearerPrefix)) {
      accessToken = authHeader.slice(bearerPrefix.length).trim();
    }

    if (accessToken && supabaseAdmin) {
      const { data: userResult, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (!error && userResult?.user) {
        const authUser = userResult.user;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        user = {
          id: authUser.id,
          email: authUser.email,
          username: profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || `user_${authUser.id.slice(-6)}`,
          displayName: profile?.display_name || authUser.email?.split('@')[0] || 'User',
          avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
          bio: profile?.bio || '',
        };
      }
    }
  } catch (e) {
    console.warn('[tRPC Context] auth parse/verify error:', e);
  }

  return {
    req: opts.req,
    user,
    supabase: supabaseAdmin || supabaseClient,
    supabaseAdmin,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now guaranteed to be non-null
    },
  });
});