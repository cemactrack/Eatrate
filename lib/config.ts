// Force production URL to fix ngrok issue
const FORCED_API_URL = 'https://eatrate.vercel.app';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || FORCED_API_URL;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiBase(): string {
  const envBase = (API_URL ?? '').trim();
  const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';

  console.log('[Config] Raw EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('[Config] Processed API_URL:', envBase);
  console.log('[Config] Forced fallback URL:', FORCED_API_URL);

  let resolved = envBase;

  // CRITICAL: Force production URL if we detect ANY dev tunnel URLs
  if (!resolved || resolved.includes('exp.direct') || resolved.includes('ngrok') || resolved.includes('localhost')) {
    if (resolved) {
      console.warn('[Config] Detected problematic URL:', resolved);
    }
    resolved = FORCED_API_URL;
    console.warn('[Config] FORCING production URL:', resolved);
  }

  // Additional safety check for web
  if (isBrowser) {
    try {
      const url = new URL(resolved);
      const host = url.host.toLowerCase();
      if (host.includes('exp.direct') || host.includes('ngrok')) {
        const origin = window.location.origin;
        console.warn('[Config] Web: Detected dev tunnel, using window.origin:', origin);
        resolved = origin;
      }
    } catch {
      // Invalid URL, use forced URL
      resolved = FORCED_API_URL;
    }
  }

  const finalUrl = stripTrailingSlash(resolved);
  console.log('[Config] FINAL API base URL:', finalUrl);
  
  // Last safety check
  if (finalUrl.includes('exp.direct') || finalUrl.includes('ngrok')) {
    console.error('[Config] CRITICAL ERROR: Still have dev tunnel URL after all fixes!');
    return stripTrailingSlash(FORCED_API_URL);
  }
  
  return finalUrl;
}

// Get allowed origins for CORS configuration
export function getAllowedOrigins(): string[] {
  const baseOrigins = [
    API_URL?.replace(/\/$/, ''), // Remove trailing slash
    'exp://127.0.0.1:8081',
    'https://localhost:3000'
  ].filter(Boolean); // Remove undefined values
  
  // Add development origins if in development
  if (process.env.NODE_ENV === 'development') {
    baseOrigins.push(
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:19006', // Expo web dev server
      'http://127.0.0.1:19006'
    );
  }
  
  return baseOrigins;
}
