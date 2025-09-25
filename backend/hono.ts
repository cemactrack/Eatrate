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
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
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
    endpoint: "/trpc",
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
      health: "/api"
    },
    timestamp: new Date().toISOString() 
  });
});

// Catch-all for debugging
app.all('*', (c) => {
  console.log(`[404] Unhandled route: ${c.req.method} ${c.req.url}`);
  return c.json({ error: 'Route not found', path: c.req.url }, 404);
});

export default app;