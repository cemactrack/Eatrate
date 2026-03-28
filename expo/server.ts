// This file exports the Hono app for Expo Router API routes
// DO NOT run this file directly - it will cause React Native import errors
// Use start-server.ts instead to run the standalone server

import honoApp from './backend/hono';

// Export the Hono app for Expo to serve
export default honoApp;

// Also export the app for other uses
export { honoApp as app };
