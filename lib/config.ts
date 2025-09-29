export const API_URL = process.env.EXPO_PUBLIC_API_URL!;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiBase(): string {
  const envBase = (API_URL ?? '').trim();
  const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';

  let resolved = envBase;

  if (!resolved) {
    if (isBrowser) {
      resolved = window.location.origin;
      console.warn('[Config] EXPO_PUBLIC_API_URL is not set. Falling back to window.origin:', resolved);
    } else {
      resolved = 'http://localhost:3000';
      console.warn('[Config] EXPO_PUBLIC_API_URL is not set. Falling back to localhost:', resolved);
    }
  }

  try {
    const url = new URL(resolved);
    const host = url.host.toLowerCase();
    if (host.includes('exp.direct') || host.includes('ngrok')) {
      if (isBrowser) {
        const origin = window.location.origin;
        console.warn('[Config] Detected dev tunnel in API_URL. Using window.origin instead:', origin);
        return stripTrailingSlash(origin);
      }
    }
  } catch {
    // allow relative base values
  }

  const finalUrl = stripTrailingSlash(resolved);
  
  // Log the final API URL once on startup
  console.info('[API Config] Final API URL:', finalUrl);
  
  return finalUrl;
}
