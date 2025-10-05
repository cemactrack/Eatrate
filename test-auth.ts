// Test authentication with exact configuration
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase Authentication...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 50 chars):', SUPABASE_ANON_KEY.substring(0, 50) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  },
});

async function testAuth() {
  try {
    console.log('\n[Test 1] Attempting to sign in with email/password...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'padebayo236@gmail.com',
      password: 'test123', // Replace with actual password
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.error('Error status:', error.status);
      console.error('Error code:', error.code);
      
      if (error.message.includes('Invalid API key') || error.status === 401) {
        console.log('\n🔍 Diagnosis: The API key is being rejected by Supabase.');
        console.log('\nPossible causes:');
        console.log('1. The key has been rotated/regenerated in Supabase dashboard');
        console.log('2. The project has been paused or deleted');
        console.log('3. The key format is corrupted');
        console.log('\n✅ Solution: Get fresh keys from:');
        console.log('   https://app.supabase.com/project/wdfukmxvpvytvxrogqiu/settings/api');
      }
      
      return false;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    return true;
    
  } catch (err: any) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

testAuth().then(success => {
  if (success) {
    console.log('\n✅ Authentication is working! The issue is with cache.');
    console.log('Follow the cache clearing instructions.');
  } else {
    console.log('\n❌ Authentication failed. The Supabase keys need to be regenerated.');
  }
  process.exit(success ? 0 : 1);
});
