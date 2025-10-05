// Test with proper client configuration
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdfukmxvpvytvxrogqiu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZnVrbXh2cHZ5dHZ4cm9ncWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NDMyMzYsImV4cCI6MjA3NDUxOTIzNn0.3KFy9y6YbDrD5--IOPLfshpb-tjraPDdkYYQBubONzo';

console.log('Creating Supabase client with proper config...\n');

// Try with explicit options
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': ANON_KEY,
    },
  },
});

async function test() {
  try {
    console.log('[Test 1] Query restaurants...');
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, city')
      .limit(3);
    
    if (error) {
      console.error('❌ Error:', error);
      return false;
    }
    
    console.log('✅ Success! Found', data?.length, 'restaurants');
    console.log('Sample:', data);
    
    return true;
  } catch (err: any) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

test().then(success => {
  if (success) {
    console.log('\n✅ Supabase client is working!');
    console.log('The issue was likely in the client configuration.');
  } else {
    console.log('\n❌ Still failing. Checking Supabase JS version...');
  }
  process.exit(success ? 0 : 1);
});
