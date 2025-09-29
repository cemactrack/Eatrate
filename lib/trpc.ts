import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import { API_URL } from "@/lib/config";
import { APP_CONFIG } from "@/constants/app-config";

// React tRPC client for use in components
export const trpc = createTRPCReact<AppRouter>();

const normalizeBaseUrl = (url: string): string => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Use centralized API_URL configuration
const base = normalizeBaseUrl(API_URL || 'http://localhost:3000');
const trpcPath = '/api/trpc';
const trpcUrl = `${base}${trpcPath}`;

// Log API configuration on startup
console.info('[tRPC] Final API URL:', trpcUrl);
console.info('[tRPC] Base URL from EXPO_PUBLIC_API_URL:', API_URL);
if (Platform.OS === 'web') {
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  console.info('[tRPC] Web page:', href);
}

// Shared HTTP link configuration
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
        credentials: Platform.OS === 'web' ? 'same-origin' : 'omit',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-trpc-source': Platform.OS === 'web' ? 'web' : 'react-native',
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
export const trpcClient = trpc.createClient({
  links: [createHttpLink()],
});

// Standalone tRPC client for use outside React components (mutations, server-side calls)
export const trpcStandaloneClient = createTRPCClient<AppRouter>({
  links: [createHttpLink()],
});

// Export both clients for different use cases
// Use `trpc` for React hooks: trpc.restaurants.list.useQuery()
// Use `trpcStandaloneClient` for imperative calls: await trpcStandaloneClient.restaurants.list.query()
