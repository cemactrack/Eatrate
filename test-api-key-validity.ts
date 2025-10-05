// Test if the API key is actually valid by making a simple request
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase API Key Validity...\n');

async function testKey() {
  try {
    // Test 1: REST API with apikey header
    console.log('[Test 1] Testing REST API with apikey header...');
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    console.log('Status:', response1.status, response1.statusText);
    
    if (response1.status === 401) {
      console.error('❌ API key is INVALID or EXPIRED');
      console.log('\n🔧 You MUST get new keys from Supabase dashboard:');
      console.log('   https://app.supabase.com/project/wdfukmxvpvytvxrogqiu/settings/api');
      return false;
    }
    
    if (response1.ok) {
      const data = await response1.json();
      console.log('✅ REST API works! Sample data:', data[0]?.name);
    }
    
    // Test 2: Auth endpoint
    console.log('\n[Test 2] Testing Auth endpoint...');
    const response2 = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    console.log('Auth Status:', response2.status, response2.statusText);
    
    if (response2.status === 401) {
      console.error('❌ Auth endpoint rejects the key');
      return false;
    }
    
    if (response2.ok) {
      console.log('✅ Auth endpoint accepts the key');
    }
    
    return true;
    
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

testKey().then(valid => {
  if (valid) {
    console.log('\n✅ API KEY IS VALID!');
    console.log('\nThe issue is with browser cache or client configuration.');
    console.log('\nNext steps:');
    console.log('1. Stop Expo (Ctrl+C)');
    console.log('2. Run: bun start -- --clear --reset-cache');
    console.log('3. Open browser in INCOGNITO mode');
    console.log('4. Go to http://localhost:8081');
    console.log('5. Check console for: [supabase] Client initialized successfully');
  } else {
    console.log('\n❌ API KEY IS INVALID!');
    console.log('\nYou MUST regenerate keys from Supabase dashboard.');
  }
  process.exit(valid ? 0 : 1);
});
