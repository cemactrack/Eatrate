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
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
};

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabase();
    return (client as any)[prop];
  }
});
