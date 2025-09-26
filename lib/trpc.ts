import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";


export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      console.log('[tRPC] Web origin:', origin);
      return origin || '';
    } catch (error) {
      console.error('[tRPC] Error getting web origin:', error);
      return '';
    }
  }

  // For native, use localhost with the dev server port
  const devServerUrl = 'http://localhost:8081';
  console.log('[tRPC] Using dev server URL for native:', devServerUrl);
  return devServerUrl;
};

const base = getBaseUrl();
const trpcPath = '/api/trpc';
const trpcUrl = `${base}${trpcPath}`;
console.log('[tRPC] API URL:', trpcUrl);
console.log('[tRPC] API Base URL:', base);
if (Platform.OS === 'web') {
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  console.log('[tRPC] Web page:', href);
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      headers() {
        return {
          authorization: 'dev',
          accept: 'application/json',
          'content-type': 'application/json'
        };
      },
      async fetch(url, options) {
        const controller = new AbortController();
        const timeoutMs = 30000;
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
          
          const contentType = response.headers.get('content-type') ?? '';
          console.log('[tRPC] Response content-type:', contentType);
          
          if (contentType.includes('text/html')) {
            const text = await response.clone().text();
            console.error('[tRPC] Received HTML instead of JSON:', text.slice(0, 500));
            console.error('[tRPC] Full URL that returned HTML:', url);
            console.error('[tRPC] Request headers:', options?.headers);
            throw new Error(`Server returned HTML instead of JSON. URL: ${url}. Check that the API route is properly configured and the server is running.`);
          }

          if (!response.ok) {
            const text = await response.clone().text();
            console.error(`[tRPC] HTTP ${response.status}:`, text.slice(0, 200));
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          clearTimeout(timeoutId);
          return response as Response;
        } catch (error: unknown) {
          clearTimeout(timeoutId);

          const anyErr = error as { name?: string; message?: string } | undefined;

          if (anyErr?.name === 'AbortError') {
            const timeoutError = new Error('Request timeout - please check your internet connection');
            (timeoutError as any).name = 'TimeoutError';
            throw timeoutError;
          }

          const msg: string = String(anyErr?.message ?? '');

          if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
            const networkError = new Error('Network error - please check your internet connection and ensure the API server is running');
            (networkError as any).name = 'NetworkError';
            console.error('[tRPC] Network error while fetching', url, error);
            throw networkError;
          }

          throw error as Error;
        }
      },
    }),
  ],
});
