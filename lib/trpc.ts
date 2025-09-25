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
  
  let defaultUrl;
  if (Platform.OS === 'android') {
    defaultUrl = "http://10.0.2.2:8081";
  } else if (Platform.OS === 'ios') {
    defaultUrl = "http://localhost:8081";
  } else {
    defaultUrl = "http://localhost:8081";
  }
  
  console.log('[tRPC] Using default URL:', defaultUrl);
  return defaultUrl;
};

const base = getBaseUrl();
const primaryPath = '/api/trpc';
const fallbackPath = '/trpc';
const apiUrl = base ? `${base}${primaryPath}` : primaryPath;
console.log('[tRPC] Using API URL:', apiUrl);
console.log('[tRPC] API Base URL:', base || '(relative)');
if (Platform.OS === 'web') {
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  console.log('[tRPC] Web page:', href);
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: apiUrl,
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

        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          });
        }

        try {
          let response = await makeRequest(String(url));

          const isHtml = async (res: Response) => {
            const contentType = res.headers.get('content-type') ?? '';
            if (contentType.includes('text/html')) {
              // Clone the response before reading it to avoid consuming the body
              const clonedRes = res.clone();
              const text = await clonedRes.text();
              console.error('[tRPC] Received HTML instead of JSON:', text.slice(0, 200));
              return true;
            }
            return false;
          };

          if (await isHtml(response) || (!response.ok && (response.headers.get('content-type') ?? '').includes('text/html'))) {
            console.error('[tRPC] Server returned HTML instead of JSON. This usually means:');
            console.error('1. The backend server is not running');
            console.error('2. The API endpoint is not properly configured');
            console.error('3. There\'s a routing issue with the server');
            
            const urlStr = String(url);
            const altUrl = urlStr.includes(primaryPath)
              ? urlStr.replace(primaryPath, fallbackPath)
              : urlStr.replace(fallbackPath, primaryPath);
            console.warn('[tRPC] Retrying request on alternate endpoint:', altUrl);
            try {
              response = await makeRequest(altUrl);
              // If the alternate endpoint works, log it for future reference
              if (response.ok && !(await isHtml(response))) {
                console.log('[tRPC] Alternate endpoint successful:', altUrl);
              }
            } catch (retryError) {
              console.error('[tRPC] Retry failed:', retryError);
              // Continue with original response
            }
          }
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            // Clone the response before reading it to avoid consuming the body
            const clonedRes = response.clone();
            const text = await clonedRes.text();
            console.error(`[tRPC] HTTP ${response.status}:`, text.slice(0, 200));
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              throw new Error(`Server returned HTML instead of JSON (${response.status}). The backend server may not be running or the API endpoint is misconfigured. Please check that the server is started and accessible at the expected URL.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type') ?? '';
          if (!contentType.includes('application/json')) {
            console.warn('[tRPC] Unexpected content-type:', contentType);
          }

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
          
          if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('TypeError: Network request failed')) {
            const networkError = new Error('Network error - please check your internet connection and ensure the API server is running');
            (networkError as any).name = 'NetworkError';
            console.error('[tRPC] Network error while fetching', url, error);
            throw networkError;
          }

          if (msg.includes('Server returned HTML')) {
            console.error('[tRPC] Server configuration error:', msg);
            throw new Error('API server configuration error - please check server setup');
          }

          throw error as Error;
        }
      },
    }),
  ],
});
