import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform, NativeModules } from "react-native";
import Constants from 'expo-constants';

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

function expoHostOrigin(): string | null {
  try {
    const hostUri = (Constants as any)?.expoConfig?.hostUri as string | undefined;
    if (hostUri && typeof hostUri === 'string') {
      const hasScheme = /^(https?:)\/\//.test(hostUri);
      const protocol = hostUri.includes('localhost') || /^(\d+\.){3}\d+/.test(hostUri) ? 'http' : 'https';
      return hasScheme ? hostUri.replace(/\/$/, '') : `${protocol}://${hostUri.replace(/\/$/, '')}`;
    }
  } catch {}
  return null;
}

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? (Constants as any)?.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (envUrl && envUrl.length > 0) return envUrl.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    return '' as const;
  }

  const expoOrigin = expoHostOrigin();
  if (expoOrigin) return expoOrigin;
  const origin = nativeDevOrigin();
  if (origin) return origin;
  return "http://10.0.2.2:8081";
};

const base = getBaseUrl();
const apiUrl = base ? `${base}/api/trpc` : `/api/trpc`;
console.log('[tRPC] API Base URL:', base || '(relative)');

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: apiUrl,
      transformer: superjson,
      headers() {
        return { authorization: 'dev' };
      },
      fetch(url, options) {
        const controller = new AbortController();
        const timeoutMs = 45000;
        const timeoutId = setTimeout(() => {
          console.warn(`[tRPC] Request timeout after ${timeoutMs / 1000} seconds:`, url);
          controller.abort();
        }, timeoutMs);

        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          });
        }

        return fetch(url, {
          ...options,
          signal: controller.signal,
          // Keep connections same-origin on web to avoid CORS/proxy issues
          credentials: Platform.OS === 'web' ? 'same-origin' : 'omit',
        } as RequestInit)
          .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response as Response;
          })
          .catch((error: unknown) => {
            clearTimeout(timeoutId);

            const anyErr = error as { name?: string; message?: string } | undefined;
            if (anyErr?.name === 'AbortError') {
              const timeoutError = new Error('Request timeout - please check your internet connection');
              (timeoutError as any).name = 'TimeoutError';
              throw timeoutError;
            }

            const msg: string = String(anyErr?.message ?? '');
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('TypeError: Network request failed')) {
              const networkError = new Error('Network error - please check your internet connection');
              (networkError as any).name = 'NetworkError';
              console.error('[tRPC] Network error while fetching', url, error);
              throw networkError;
            }

            throw error as Error;
          });
      },
    }),
  ],
});