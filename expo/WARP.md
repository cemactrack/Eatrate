# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Prerequisites

- **Package Manager**: pnpm (required per user rules)
- **Runtime**: Bun (required for server execution)
- **Node.js**: Version compatible with React Native 0.79.1 and React 19

## Essential Commands

### Installation & Setup
```bash
pnpm install
```

### Development
```bash
# Start Expo development server (mobile preview)
pnpm start

# Start with tunnel for device testing
pnpm start:tunnel

# Start web preview
pnpm start-web

# Start backend API server (port 3000)
pnpm server:dev

# Production API server
pnpm server
```

### Build & Deploy
```bash
# Build for web deployment
pnpm build

# Lint the codebase
pnpm lint
```

### Testing & Diagnostics
```bash
# Test API endpoints
pnpm test:api

# Test Supabase connection
pnpm test:supabase

# Run individual test files
bun run test-supabase.ts
bun run test-api-endpoints.ts
```

## Architecture Overview

### Frontend (Expo + React Native)
- **Framework**: Expo Router v5 with file-based routing
- **Navigation**: Tab-based layout with nested stacks (`(tabs)`, `(home)`, `(profile)`, etc.)
- **State Management**: Zustand + TanStack Query (React Query)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Cross-Platform**: iOS, Android, and Web support

### Backend (Hono + tRPC)
- **Server**: Hono.js web framework with tRPC for type-safe APIs
- **Entry Points**: 
  - `start-server.ts` (standalone Bun server)
  - `backend/hono.ts` (main application)
  - `app/api/trpc/[...trpc]+api.ts` (Expo Router integration)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with profile auto-creation
- **Rate Limiting**: Built-in middleware for read/write operations

### Data Layer
- **ORM**: Direct Supabase client usage
- **Schema**: 
  - `restaurants` (main business data)
  - `posts` (user-generated content)
  - `profiles` (user metadata)
  - `reviews`, `bookmarks`, `follows` (social features)
- **Real-time**: Supabase subscriptions for live updates

### Environment Configuration
- **Client Variables**: `EXPO_PUBLIC_*` prefix (embedded in bundle)
- **Server Variables**: Standard env vars for backend operations
- **Resolution**: `lib/env.ts` handles both process.env and Expo config
- **Fallback**: Development defaults in `app.json` extra field

### Path Resolution
- **Alias**: `@/*` maps to project root (configured in `tsconfig.json`)
- **Backend**: `@/backend/*` for server-side code
- **Frontend**: `@/components/*`, `@/lib/*`, `@/constants/*`

## Key Integrations

### tRPC Router Structure
- **Main Router**: `backend/trpc/app-router.ts` (500+ lines)
- **Route Groups**: auth, posts, restaurants, admin, messaging, etc.
- **Procedures**: Organized by domain (create, read, update, delete patterns)
- **Middleware**: Rate limiting, CORS, authentication context

### Deployment (Vercel)
- **Build**: `expo export -p web` generates static files
- **API Routes**: Hono app serves backend at `/api/*`
- **Rewrites**: SPA routing handled by `vercel.json`

### Development Tools
- **ESLint**: Expo configuration with custom ignores
- **TypeScript**: Strict mode with path mapping
- **Health Checks**: Multiple diagnostic endpoints (`/api/debug/*`)

## Typical Development Workflow

1. **Environment Setup**: Copy `.env.example` to `.env` and configure Supabase credentials
2. **Start Services**: Run `pnpm server:dev` (backend) and `pnpm start-web` (frontend) concurrently
3. **Testing**: Use health endpoints (`/api`, `/api/debug/env`) to verify connectivity
4. **Database**: Supabase admin interface for schema changes, use test scripts for data verification

## Notes

- **Port Conflicts**: Backend defaults to 3000, Expo to 8081/19006
- **CORS**: Configured for localhost and deployment domains
- **Performance**: Virtualized lists, optimized images, lazy loading implemented
- **Admin Panel**: Full-featured admin interface at `/admin/*` routes
- **Messaging**: Real-time messaging system with typing indicators
- **File Uploads**: Image handling with size limits and optimization