import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { supabaseAdmin } from "./supabase-admin";
import { writeOperationsLimiter, readOperationsLimiter, isWriteOperation } from "./middleware/rate-limiter";

// Create the main app
const app = new Hono();

// Enable CORS with strict configuration
app.use("*", cors({
  origin: [
    'https://eatrate.vercel.app',
    'https://eatrate-api.vercel.app',
    'exp://127.0.0.1:8081',
    'http://localhost:8081',
    'https://eatrate.co'
  ],
  credentials: false,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Add request logging middleware
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${url.pathname}${url.search}`);
  console.log(`[Headers] Content-Type: ${c.req.header('content-type')}, Accept: ${c.req.header('accept')}`);
  console.log(`[Headers] x-trpc-source: ${c.req.header('x-trpc-source')}`);
  await next();
});

// Add rate limiting middleware for tRPC endpoints
app.use('/api/trpc/*', async (c, next) => {
  const url = new URL(c.req.url);
  const procedurePath = url.pathname.replace('/api/trpc/', '');
  
  // Apply appropriate rate limiter based on operation type
  if (isWriteOperation(procedurePath)) {
    return writeOperationsLimiter(c, next);
  } else {
    return readOperationsLimiter(c, next);
  }
});

// Add rate limiting middleware for fallback tRPC endpoints
app.use('/trpc/*', async (c, next) => {
  const url = new URL(c.req.url);
  const procedurePath = url.pathname.replace('/trpc/', '');
  
  // Apply appropriate rate limiter based on operation type
  if (isWriteOperation(procedurePath)) {
    return writeOperationsLimiter(c, next);
  } else {
    return readOperationsLimiter(c, next);
  }
});

// Mount tRPC router at /api/trpc (primary endpoint)
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  })
);

// Also mount at /trpc as fallback
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  })
);

// Handle tRPC requests at root level for debugging
app.all('/api/trpc', (c) => {
  console.log('[tRPC] Root API endpoint hit:', c.req.method, c.req.url);
  return c.json({ 
    error: 'tRPC endpoint requires a procedure path', 
    example: '/api/trpc/healthCheck',
    timestamp: new Date().toISOString()
  }, 400);
});

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "EatRate API is running", timestamp: new Date().toISOString() });
});

// API info endpoint
app.get("/api", (c) => {
  return c.json({ 
    status: "ok", 
    message: "EatRate API is running", 
    endpoints: {
      trpc: "/api/trpc",
      trpcAlt: "/trpc",
      health: "/api",
      healthCheck: "/api/trpc/healthCheck",
      authSession: "/api/auth/session",
    },
    timestamp: new Date().toISOString() 
  });
});

// Test tRPC endpoint directly
app.get("/test-trpc", (c) => {
  return c.json({ 
    success: true, 
    message: "tRPC router is accessible",
    routerKeys: Object.keys(appRouter._def.procedures),
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to test server status
app.get("/debug/server-status", (c) => {
  return c.json({ 
    success: true, 
    message: "Server is running and responding",
    serverTime: new Date().toISOString(),
    userAgent: c.req.header('user-agent'),
    method: c.req.method,
    url: c.req.url,
    headers: Object.fromEntries(c.req.raw.headers.entries())
  });
});

// Auth session endpoint: verifies Supabase access token and ensures profile row exists
app.post('/api/auth/session', writeOperationsLimiter, async (c) => {
  try {
    if (!supabaseAdmin) {
      console.error('[AuthSession] Supabase admin client is not configured');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const authHeader = c.req.header('authorization') || '';
    const bearerPrefix = 'bearer ';
    let accessToken = '';

    if (authHeader.toLowerCase().startsWith(bearerPrefix)) {
      accessToken = authHeader.slice(bearerPrefix.length).trim();
    } else {
      try {
        const body = await c.req.json<{ access_token?: string }>();
        accessToken = body?.access_token ?? '';
      } catch {
        // ignore body parse errors
      }
    }

    if (!accessToken) {
      return c.json({ error: 'Missing access token' }, 401);
    }

    const {
      data: userResult,
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userResult?.user) {
      console.error('[AuthSession] Invalid access token', userError);
      return c.json({ error: 'Invalid token' }, 401);
    }

    const user = userResult.user;
    const userId = user.id;
    const email: string = (user.email ?? '').toString();
    const emailLocal = email.includes('@') ? email.split('@')[0] : '';
    const defaultDisplayName = emailLocal || `user-${userId.slice(0, 6)}`;

    // Try to insert profile if not exists (id is PK)
    const insertPayload: Record<string, unknown> = {
      id: userId,
      email: email || null,
      display_name: defaultDisplayName,
      created_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .insert(insertPayload)
      .onConflict('id')
      .ignore();

    if (upsertError) {
      console.error('[AuthSession] Upsert error', upsertError);
    }

    // Ensure display_name is set if null
    const { data: profile, error: selectErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', userId)
      .single();

    if (selectErr) {
      console.error('[AuthSession] Select profile error', selectErr);
      return c.json({ error: 'Failed to read profile' }, 500);
    }

    if (profile && !profile.display_name) {
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ display_name: defaultDisplayName })
        .eq('id', userId);
      if (updateErr) {
        console.error('[AuthSession] Update display_name error', updateErr);
      }
    }

    return c.json({ ok: true, user: { id: userId, email }, profile: { id: userId, email, display_name: profile?.display_name ?? defaultDisplayName }, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[AuthSession] Unexpected error', e);
    return c.json({ error: 'Unexpected server error' }, 500);
  }
});

// Catch-all for debugging
app.all('*', (c) => {
  const url = new URL(c.req.url);
  console.log(`[404] Unhandled route: ${c.req.method} ${url.pathname}${url.search}`);
  console.log(`[404] Available routes: /api, /api/trpc/*, /trpc/*, /test-trpc`);
  return c.json({ 
    error: 'Route not found', 
    path: c.req.url,
    availableRoutes: ['/api', '/api/trpc/*', '/trpc/*', '/test-trpc'],
    timestamp: new Date().toISOString()
  }, 404);
});

export default app;
export { app };