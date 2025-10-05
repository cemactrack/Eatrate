// Quick test to verify Supabase keys are valid
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL.substring(0, 40) + '...');
console.log('Key length:', SUPABASE_ANON_KEY.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
  },
});

async function testConnection() {
  try {
    // Test 1: Simple query
    console.log('\n[Test 1] Testing basic query...');
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Query failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return false;
    }
    
    console.log('✅ Query successful!');
    console.log('Sample data:', data);
    
    // Test 2: Auth check
    console.log('\n[Test 2] Testing auth...');
    const { data: session } = await supabase.auth.getSession();
    console.log('Session:', session.session ? 'Active' : 'No session (expected)');
    
    return true;
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Supabase keys are valid.');
  } else {
    console.log('\n❌ Tests failed. Keys may be invalid or expired.');
    console.log('\nTo fix:');
    console.log('1. Go to: https://app.supabase.com/project/wdfukmxvpvytvxrogqiu/settings/api');
    console.log('2. Copy fresh anon and service_role keys');
    console.log('3. Update .env and app.json');
  }
  process.exit(success ? 0 : 1);
});
