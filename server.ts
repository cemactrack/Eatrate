// Bun automatically loads .env file
console.log('[Server] Environment check:');
console.log('[Server] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Server] EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Server] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('[Server] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('[Server] EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

import honoApp from './backend/hono';

// Log server startup
console.log(`[Server] Starting EatRate API server at ${new Date().toISOString()}`);

// Export the Hono app for Expo to serve
export default honoApp;

// Also export the app for other uses
export { honoApp as app };
