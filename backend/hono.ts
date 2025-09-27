import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

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
      healthCheck: "/api/trpc/healthCheck"
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