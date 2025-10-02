import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[Supabase] Initializing Supabase admin client...');
console.log('[Supabase] URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('[Supabase] Service Key:', supabaseServiceKey ? 'SET' : 'NOT SET');
console.log('[Supabase] Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  console.log('[Supabase] Creating admin client with service key');
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else if (supabaseUrl && supabaseAnonKey) {
  console.log('[Supabase] Creating client with anon key (fallback)');
  // Fallback with anon client (reduced privileges) to avoid hard crash in non-prod envs
  supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.error('[Supabase] CRITICAL: No Supabase credentials found!');
  console.error('[Supabase] Please check your .env file');
}

console.log('[Supabase] Admin client initialized:', supabaseAdmin ? 'SUCCESS' : 'FAILED');

export { supabaseAdmin };
