import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

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
    // You can add more context items here like database connections, auth, etc.
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