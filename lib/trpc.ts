import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        return { authorization: 'dev' };
      },
      fetch(url, options) {
        // Create timeout signal with better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('[tRPC] Request timeout after 10 seconds:', url);
          controller.abort();
        }, 10000); // Reduced to 10 second timeout for faster failure detection
        
        // Combine with existing signal if present
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          });
        }
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
        .then(response => {
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          
          // Enhanced error handling
          if (error.name === 'AbortError') {
            const timeoutError = new Error('Request timeout - please check your internet connection');
            timeoutError.name = 'TimeoutError';
            throw timeoutError;
          }
          
          if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
            const networkError = new Error('Network error - please check your internet connection');
            networkError.name = 'NetworkError';
            throw networkError;
          }
          
          throw error;
        });
      },
    }),
  ],
});