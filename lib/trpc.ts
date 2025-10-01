import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import { getAPI_URL } from "@/lib/config";
import { APP_CONFIG } from "@/constants/app-config";

// React tRPC client for use in components
export const trpc = createTRPCReact<AppRouter>();

function getTrpcUrl() {
  const trpcPath = '/api/trpc';
  try {
    const base = getAPI_URL().trim();
    return Platform.OS === 'web' ? trpcPath : `${base}${trpcPath}`;
  } catch (error) {
    console.error('[tRPC] Failed to get API URL:', error);
    return trpcPath;
  }
}

const trpcUrl = getTrpcUrl();
console.info('[tRPC] Final API URL:', trpcUrl);
if (Platform.OS === 'web') {
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  console.info('[tRPC] Web page:', href);
}


// Shared HTTP link configuration with React Native optimizations
const createHttpLink = () => httpLink({
  url: trpcUrl,
  transformer: superjson,
  headers() {
    return {
      accept: 'application/json',
      'content-type': 'application/json',
    };
  },
  async fetch(url, options) {
    const controller = new AbortController();
    const timeoutMs = APP_CONFIG.api.timeout;
    const timeoutId = setTimeout(() => {
      console.warn(`[tRPC] Request timeout after ${timeoutMs / 1000} seconds:`, url);
      controller.abort();
    }, timeoutMs);

    try {
      console.log('[tRPC] Making request to:', url);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // React Native Web compatibility
        credentials: Platform.OS === 'web' ? 'same-origin' : 'omit',
        // Ensure proper headers for React Native
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-trpc-source': Platform.OS === 'web' ? 'web' : 'react-native',
          'x-platform': Platform.OS,
          ...options?.headers,
        },
      } as RequestInit);

      console.log('[tRPC] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let text = '';
        try {
          text = await response.clone().text();
        } catch {
          text = 'Unable to read error response';
        }
        console.error(`[tRPC] HTTP ${response.status}:`, text.slice(0, 200));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response as Response;
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

// React Query tRPC client for use with React hooks
// Optimized for React Native with proper suspense handling
export const trpcClient = trpc.createClient({
  links: [createHttpLink()],
});

// Standalone tRPC client for use outside React components (mutations, server-side calls)
export const trpcStandaloneClient = createTRPCClient<AppRouter>({
  links: [createHttpLink()],
});

// Export both clients for different use cases
// Use `trpc` for React hooks: trpc.restaurants.list.useQuery({ city: 'douala' })
// Use `trpcStandaloneClient` for imperative calls: await trpcStandaloneClient.restaurants.list.query({ city: 'douala' })

// Typed hooks examples for common operations:
// - trpc.restaurantsMain.list.useQuery({ city, limit: 10 })
// - trpc.restaurantsMain.search.useQuery({ query: 'pizza', city: 'yaounde' })
// - trpc.reviews.create.useMutation()
// - trpc.postsMain.feed.useQuery({ limit: 20, cursor: undefined })
// - trpc.auth.getCurrentProfile.useQuery()
// - trpc.bookmarks.toggleRestaurant.useMutation()
// - trpc.follows.toggleUser.useMutation()
// - trpc.notifications.getAll.useQuery()
// - trpc.messaging.getConversations.useQuery()
