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
      const match = scriptURL.match(/^(https?:):\/\/([^/:]+):(\d+)/);
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
  if (Platform.OS === 'web') {
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      console.log('[tRPC] Web origin:', origin);
      return origin || '';
    } catch (error) {
      console.error('[tRPC] Error getting web origin:', error);
      return '' as const;
    }
  }

  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? ((Constants as any)?.expoConfig?.extra?.apiBaseUrl as string | undefined);
  if (envUrl && envUrl.length > 0) {
    console.log('[tRPC] Using environment URL:', envUrl);
    return envUrl.replace(/\/$/, '');
  }

  const expoOrigin = expoHostOrigin();
  if (expoOrigin) {
    console.log('[tRPC] Using Expo host origin:', expoOrigin);
    return expoOrigin;
  }
  
  const origin = nativeDevOrigin();
  if (origin) {
    console.log('[tRPC] Using native dev origin:', origin);
    return origin;
  }
  
  let defaultUrl: string;
  if (Platform.OS === 'android') {
    defaultUrl = "http://10.0.2.2:8081";
  } else if (Platform.OS === 'ios') {
    defaultUrl = "http://localhost:8081";
  } else {
    defaultUrl = "";
  }
  
  console.log('[tRPC] Using default URL:', defaultUrl);
  return defaultUrl;
};

const base = getBaseUrl();
const primaryPath = '/api/trpc';
const fallbackPath = '/trpc';
const primaryUrl = base ? `${base}${primaryPath}` : primaryPath;
const fallbackUrl = base ? `${base}${fallbackPath}` : fallbackPath;
console.log('[tRPC] Primary API URL:', primaryUrl);
console.log('[tRPC] Fallback API URL:', fallbackUrl);
console.log('[tRPC] API Base URL:', base || '(relative)');
if (Platform.OS === 'web') {
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  console.log('[tRPC] Web page:', href);
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: primaryUrl,
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

        const makeRequest = async (targetUrl: string) => {
          return fetch(targetUrl, {
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
        };

        if ((options as RequestInit | undefined)?.signal) {
          (options as RequestInit).signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          });
        }

        const tryUrls: string[] = [String(url)];
        const asString = String(url);
        if (asString.includes(primaryPath)) {
          tryUrls.push(asString.replace(primaryPath, fallbackPath));
        }
        if (base) {
          tryUrls.push(primaryPath, fallbackPath);
        } else {
          tryUrls.push(primaryUrl, fallbackUrl);
        }

        try {
          let lastErr: unknown = null;
          for (const target of tryUrls) {
            try {
              console.log('[tRPC] Trying URL:', target);
              let response = await makeRequest(target);
              console.log('[tRPC] Response status:', response.status, response.statusText);
              console.log('[tRPC] Response headers:', Object.fromEntries(response.headers.entries()));

              const contentType = response.headers.get('content-type') ?? '';
              console.log('[tRPC] Response content-type:', contentType);
              if (contentType.includes('text/html')) {
                const text = await response.clone().text();
                console.error('[tRPC] Received HTML instead of JSON:', text.slice(0, 200));
                throw new Error('HTML_RESPONSE');
              }

              if (!response.ok) {
                const text = await response.clone().text();
                console.error(`[tRPC] HTTP ${response.status}:`, text.slice(0, 200));
                if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                  throw new Error('HTML_RESPONSE');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              clearTimeout(timeoutId);
              if (!contentType.includes('application/json')) {
                console.warn('[tRPC] Unexpected content-type:', contentType);
              }
              return response as Response;
            } catch (innerErr) {
              lastErr = innerErr;
              const msg = String((innerErr as { message?: string } | null)?.message ?? '');
              console.warn('[tRPC] Attempt failed for', target, msg);
              continue;
            }
          }

          throw lastErr as Error;
        } catch (error: unknown) {
          clearTimeout(timeoutId);

          const anyErr = error as { name?: string; message?: string } | undefined;

          if (anyErr?.name === 'AbortError') {
            const timeoutError = new Error('Request timeout - please check your internet connection');
            (timeoutError as any).name = 'TimeoutError';
            throw timeoutError;
          }

          const msg: string = String(anyErr?.message ?? '');

          if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('TypeError: Network request failed')) {
            const networkError = new Error('Network error - please check your internet connection and ensure the API server is running');
            (networkError as any).name = 'NetworkError';
            console.error('[tRPC] Network error while fetching', url, error);
            throw networkError;
          }

          if (msg.includes('HTML_RESPONSE')) {
            console.error('[tRPC] Server returned HTML instead of JSON. Check that the API routes are mounted at /api/trpc or /trpc and the dev server is running.');
            throw new Error('API server configuration error - server returned HTML instead of JSON');
          }

          throw error as Error;
        }
      },
    }),
  ],
});
