// Direct Supabase test utility (for diagnosis only)
import { createClient } from '@supabase/supabase-js';
import { getSUPABASE_URL, getSUPABASE_ANON_KEY } from '@/lib/env';

export async function testDirectSupabaseRead() {
  try {
    const url = getSUPABASE_URL();
    const key = getSUPABASE_ANON_KEY();
    
    console.log('[Direct Supabase Test] Creating client...');
    const sb = createClient(url, key);
    
    console.log('[Direct Supabase Test] Querying restaurants...');
    const { data, error } = await sb
      .from('restaurants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('[Direct Supabase Test] ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error: error.message, data: null };
    }
    
    console.log('[Direct Supabase Test] SUCCESS:', {
      count: data?.length || 0,
      sample: data?.[0] || null
    });
    
    return { success: true, error: null, data };
  } catch (e: any) {
    console.error('[Direct Supabase Test] EXCEPTION:', e.message);
    return { success: false, error: e.message, data: null };
  }
}

// Log config on import (for debugging)
try {
  const url = getSUPABASE_URL();
  const key = getSUPABASE_ANON_KEY();
  console.log('[Direct Supabase Test] Config loaded:', {
    hasUrl: !!url,
    hasKey: !!key,
    urlPrefix: url?.substring(0, 30)
  });
} catch (e: any) {
  console.error('[Direct Supabase Test] Config error:', e.message);
}
