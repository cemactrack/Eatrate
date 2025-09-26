import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { trpcClient as mockTrpcClient } from "./trpc-mock";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    try {
      // For web, use the current origin
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      console.log('[tRPC] Web origin:', origin);
      return origin || '';
    } catch (error) {
      console.error('[tRPC] Error getting web origin:', error);
      return '';
    }
  }

  // For native, try to get the dev server URL from Constants
  try {
    const debuggerHost = Constants.expoConfig?.hostUri
      ? Constants.expoConfig.hostUri.split(':').shift()
      : Constants.expoConfig?.debuggerHost || 'localhost';
    const devServerUrl = `http://${debuggerHost}:8081`;
    console.log('[tRPC] Using dev server URL for native:', devServerUrl);
    return devServerUrl;
  } catch (error) {
    console.error('[tRPC] Error getting native URL:', error);
    return 'http://localhost:8081';
  }
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

// Flag to track if we should use mock client
let useMockClient = false;

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
        // If we've determined to use mock client, throw immediately
        if (useMockClient) {
          console.log('[tRPC] Using mock client, skipping real API call');
          throw new Error('Using mock client');
        }

        const controller = new AbortController();
        const timeoutMs = 8000; // Reduced timeout for faster fallback
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
          
          // Check if response is HTML (common when API routes aren't working)
          if (contentType.includes('text/html') || response.status === 404) {
            let text = '';
            try {
              text = await response.clone().text();
            } catch {
              text = 'Unable to read response text';
            }
            
            console.error('[tRPC] Received HTML/404 instead of JSON:', text.slice(0, 300));
            console.error('[tRPC] Full URL that returned HTML/404:', url);
            console.error('[tRPC] Request headers:', options?.headers);
            
            // Switch to mock client for future requests
            console.warn('[tRPC] Switching to mock client due to HTML/404 response');
            useMockClient = true;
            
            throw new Error(`Server returned HTML/404 instead of JSON. Switching to mock client.`);
          }

          // Check for JSON parse errors by trying to read the response
          if (response.ok) {
            try {
              const clonedResponse = response.clone();
              const text = await clonedResponse.text();
              
              // Try to parse as JSON to catch parse errors early
              if (text.trim()) {
                JSON.parse(text);
              }
            } catch (parseError) {
              console.error('[tRPC] JSON parse error in response:', parseError);
              console.error('[tRPC] Response text that failed to parse:', await response.clone().text());
              
              // Switch to mock client for JSON parse errors
              console.warn('[tRPC] Switching to mock client due to JSON parse error');
              useMockClient = true;
              
              throw new Error(`JSON parse error - switching to mock client: ${parseError}`);
            }
          }

          if (!response.ok) {
            let text = '';
            try {
              text = await response.clone().text();
            } catch {
              text = 'Unable to read error response';
            }
            
            console.error(`[tRPC] HTTP ${response.status}:`, text.slice(0, 200));
            
            // Switch to mock client for server errors
            if (response.status >= 500) {
              console.warn('[tRPC] Switching to mock client due to server error');
              useMockClient = true;
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          clearTimeout(timeoutId);
          return response as Response;
        } catch (error: unknown) {
          clearTimeout(timeoutId);

          const anyErr = error as { name?: string; message?: string } | undefined;

          if (anyErr?.name === 'AbortError') {
            console.warn('[tRPC] Request timeout, switching to mock client');
            useMockClient = true;
            const timeoutError = new Error('Request timeout - switching to mock client');
            (timeoutError as any).name = 'TimeoutError';
            throw timeoutError;
          }

          const msg: string = String(anyErr?.message ?? '');

          if (msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('JSON parse error')) {
            console.warn('[tRPC] Network/Parse error, switching to mock client');
            useMockClient = true;
            const networkError = new Error('Network/Parse error - switching to mock client');
            (networkError as any).name = 'NetworkError';
            console.error('[tRPC] Network/Parse error while fetching', url, error);
            throw networkError;
          }

          throw error as Error;
        }
      },
    }),
  ],
});

// Export both real and mock clients
export { mockTrpcClient };
export const getCurrentTrpcClient = () => useMockClient ? mockTrpcClient : trpcClient;
