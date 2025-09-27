import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import { APP_CONFIG } from "@/constants/app-config";

export const trpc = createTRPCReact<AppRouter>();

const normalizeBaseUrl = (url: string): string => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const base = normalizeBaseUrl(APP_CONFIG.api.baseUrl);
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
    }),
  ],
});
