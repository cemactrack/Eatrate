import app from './backend/hono';

// Log server startup
console.log(`[Server] Starting EatRate API server at ${new Date().toISOString()}`);

// Export the Hono app for Expo to serve
export default app;

// Also export the app for other uses
export { app };
