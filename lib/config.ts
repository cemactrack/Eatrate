export const API_URL = process.env.EXPO_PUBLIC_API_URL!;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export function getApiBase(): string {
  const base = API_URL ?? '';
  if (!base) {
    console.error('[Config] EXPO_PUBLIC_API_URL is not set');
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}
