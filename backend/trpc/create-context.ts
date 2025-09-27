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
      }
    })
  : null;

// Create a Supabase client with anon key as fallback (less privileged)
const supabaseClient = supabaseUrl && supabaseAnonKey && !supabaseAdmin
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // In a real app, you would extract the user from the request headers/cookies
  // For now, we'll simulate a user based on a simple header
  const authHeader = opts.req.headers.get('authorization');
  const user = authHeader ? { 
    id: 'user_123', 
    email: 'user@example.com',
    username: 'user123',
    displayName: 'Test User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
    bio: 'Test user bio'
  } : null;
  
  return {
    req: opts.req,
    user,
    // Provide Supabase clients to the context
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