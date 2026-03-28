// Standalone server startup script (doesn't import React Native)
// Bun automatically loads .env file
console.log('[Server] Environment check:');
console.log('[Server] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Server] EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Server] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('[Server] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('[Server] EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

// Import only the Hono app (backend)
import honoApp from './backend/hono';

// Log server startup
console.log(`[Server] Starting EatRate API server at ${new Date().toISOString()}`);

const PORT = process.env.PORT || 3000;

// Start the server
const server = Bun.serve({
  port: PORT,
  fetch: honoApp.fetch,
});

console.log(`[Server] 🚀 Server running on http://localhost:${server.port}`);
console.log(`[Server] 📡 tRPC endpoint: http://localhost:${server.port}/api/trpc`);
console.log(`[Server] 🏥 Health check: http://localhost:${server.port}/api`);
console.log(`[Server] 📊 Debug restaurants: http://localhost:${server.port}/api/debug/restaurants`);
console.log(`[Server] 🔧 Debug env: http://localhost:${server.port}/api/debug/env`);

// Keep the server running
console.log('\n[Server] Press Ctrl+C to stop the server\n');
