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
    supabaseClient = createClient(getSUPABASE_URL(), getSUPABASE_ANON_KEY());
  }
  return supabaseClient;
};

export const supabase = getSupabase();
