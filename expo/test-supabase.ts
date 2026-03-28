// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('\n=== Supabase Connection Test ===\n');
console.log('URL:', supabaseUrl || 'NOT SET');
console.log('Service Key:', supabaseServiceKey ? 'SET (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');
console.log('Anon Key:', supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'NOT SET');
console.log('');

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set!');
  process.exit(1);
}

const key = supabaseServiceKey || supabaseAnonKey;
if (!key) {
  console.error('❌ No Supabase key found!');
  process.exit(1);
}

console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('✅ Client created\n');

// Test 1: Check restaurants table
console.log('Test 1: Fetching restaurants...');
const { data: restaurants, error: restaurantsError } = await supabase
  .from('restaurants')
  .select('id, name')
  .limit(5);

if (restaurantsError) {
  console.error('❌ Restaurants error:', restaurantsError.message);
  console.error('   Details:', restaurantsError);
} else {
  console.log(`✅ Restaurants: Found ${restaurants?.length || 0} records`);
  if (restaurants && restaurants.length > 0) {
    restaurants.forEach((r: any) => console.log(`   - ${r.name}`));
  } else {
    console.log('   ⚠️  Table is empty');
  }
}
console.log('');

// Test 2: Check posts table
console.log('Test 2: Fetching posts...');
const { data: posts, error: postsError } = await supabase
  .from('posts')
  .select('id, content')
  .limit(5);

if (postsError) {
  console.error('❌ Posts error:', postsError.message);
  console.error('   Details:', postsError);
} else {
  console.log(`✅ Posts: Found ${posts?.length || 0} records`);
  if (posts && posts.length > 0) {
    posts.forEach((p: any) => console.log(`   - ${p.content?.substring(0, 50)}...`));
  } else {
    console.log('   ⚠️  Table is empty');
  }
}
console.log('');

// Test 3: Check profiles table
console.log('Test 3: Fetching profiles...');
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, display_name')
  .limit(5);

if (profilesError) {
  console.error('❌ Profiles error:', profilesError.message);
  console.error('   Details:', profilesError);
} else {
  console.log(`✅ Profiles: Found ${profiles?.length || 0} records`);
  if (profiles && profiles.length > 0) {
    profiles.forEach((p: any) => console.log(`   - ${p.display_name || 'No name'}`));
  } else {
    console.log('   ⚠️  Table is empty');
  }
}
console.log('');

console.log('=== Test Complete ===\n');

if (restaurantsError || postsError || profilesError) {
  console.log('⚠️  Some tests failed. Check the errors above.');
  console.log('   Common issues:');
  console.log('   - Tables don\'t exist: Run the SQL from DEBUG_SUPABASE_CONNECTION.md');
  console.log('   - RLS blocking access: Check Row Level Security policies');
  console.log('   - Wrong credentials: Verify .env file');
} else if (!restaurants?.length && !posts?.length && !profiles?.length) {
  console.log('⚠️  All tables are empty!');
  console.log('   Add sample data using the SQL from DEBUG_SUPABASE_CONNECTION.md');
} else {
  console.log('✅ Connection successful! Your Supabase is configured correctly.');
}
