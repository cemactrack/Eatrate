import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform, NativeModules } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

function nativeDevOrigin(): string | null {
  try {
    const scriptURL = (NativeModules as any)?.SourceCode?.scriptURL as string | undefined;
    if (scriptURL && typeof scriptURL === 'string') {
      const match = scriptURL.match(/^(https?:)\/\/([^/:]+):(\d+)/);
      if (match) {
        const protocol = match[1];
        const host = match[2];
        const port = match[3];
        return `${protocol}//${host}:${port}`;
      }
    }
  } catch {}
  return null;
}

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  if (Platform.OS === 'web' && typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  const origin = nativeDevOrigin();
  if (origin) return origin;
  return "http://127.0.0.1:8081";
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('[tRPC] Request timeout after 10 seconds:', url);
          controller.abort();
        }, 10000);

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
          .catch((error: any) => {
            clearTimeout(timeoutId);

            if (error?.name === 'AbortError') {
              const timeoutError = new Error('Request timeout - please check your internet connection');
              (timeoutError as any).name = 'TimeoutError';
              throw timeoutError;
            }

            const msg: string = String(error?.message ?? '');
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('TypeError: Network request failed')) {
              const networkError = new Error('Network error - please check your internet connection');
              (networkError as any).name = 'NetworkError';
              console.error('[tRPC] Network error while fetching', url, error);
              throw networkError;
            }

            throw error;
          });
      },
    }),
  ],
});