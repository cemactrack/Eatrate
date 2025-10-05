import { createClient } from '@supabase/supabase-js';
import { getSUPABASE_URL, getSUPABASE_ANON_KEY } from './env';

export const isSupabaseConfigured = (): boolean => {
  try {
    const url = getSUPABASE_URL();
    const key = getSUPABASE_ANON_KEY();
    return Boolean(url && key);
  } catch {
    return false;
  }
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    const url = getSUPABASE_URL();
    const key = getSUPABASE_ANON_KEY();
    console.log('[supabase] Initializing client with URL:', url?.substring(0, 30) + '...');
    console.log('[supabase] Key length:', key?.length);
    console.log('[supabase] Adding apikey header to global config');
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      },
    });
    console.log('[supabase] Client initialized successfully');
  }
  return supabaseClient;
};

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabase();
    return (client as any)[prop];
  }
});
