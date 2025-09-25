import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Create the main app
const app = new Hono();

// Enable CORS for all routes with permissive dev-friendly configuration
app.use("*", cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
}));

// Add request logging middleware
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${url.pathname}${url.search}`);
  console.log(`[Headers] Content-Type: ${c.req.header('content-type')}, Accept: ${c.req.header('accept')}`);
  await next();
});

// Mount tRPC router at /trpc
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

// Also mount at /api/trpc for environments mounting this app at /api
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

// Catch-all for debugging
app.all('*', (c) => {
  const url = new URL(c.req.url);
  console.log(`[404] Unhandled route: ${c.req.method} ${url.pathname}${url.search}`);
  return c.json({ error: 'Route not found', path: c.req.url }, 404);
});

export default app;