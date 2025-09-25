import app from './backend/hono';

// Log server startup
console.log(`[Server] Starting EatRate API server at ${new Date().toISOString()}`);

// Export the Hono app
export default app;
