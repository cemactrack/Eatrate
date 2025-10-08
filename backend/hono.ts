import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { supabaseAdmin } from "./supabase-admin";
import { writeOperationsLimiter, readOperationsLimiter, isWriteOperation } from "./middleware/rate-limiter";
import { getAllowedOrigins } from "./server-config";

// Create the main app
const app = new Hono();

// Enable CORS with dynamic configuration
const corsOrigins = getAllowedOrigins();
console.log('[CORS] Allowed origins:', corsOrigins);

app.use("*", cors({
  origin: corsOrigins,
  credentials: false,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-platform',
    'x-trpc-source',
    'accept'
  ],
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

// Debug endpoint for environment variables
app.get("/api/debug/env", (c) => {
  return c.json({
    api: true,
    SUPABASE_URL: !!process.env.SUPABASE_URL || !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    HAS_ANON: !!process.env.SUPABASE_ANON_KEY || !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    HAS_SERVICE: !!process.env.SUPABASE_SERVICE_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    supabaseConfigured: !!supabaseAdmin,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for restaurants data
app.get("/api/debug/restaurants", async (c) => {
  try {
    if (!supabaseAdmin) {
      return c.json({ 
        error: 'Supabase admin client not configured',
        count: 0,
        sample: []
      }, 500);
    }

    const { data: restaurants, error, count } = await supabaseAdmin
      .from('restaurants')
      .select('*', { count: 'exact' })
      .limit(3);

    if (error) {
      console.error('[Debug] Restaurants query error:', error);
      return c.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        count: 0,
        sample: []
      }, 500);
    }

    return c.json({
      success: true,
      count: count || 0,
      sample: restaurants || [],
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('[Debug] Restaurants endpoint error:', e);
    return c.json({
      error: e.message || 'Unknown error',
      count: 0,
      sample: []
    }, 500);
  }
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
    // Note: profiles table only has: id, display_name, avatar_url, created_at
    const insertPayload: Record<string, unknown> = {
      id: userId,
      display_name: defaultDisplayName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    };

    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(insertPayload, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });

    if (upsertError) {
      console.error('[AuthSession] upsert error', upsertError);
    }
    // Ensure display_name is set if null
    const { data: profile, error: selectErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url')
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