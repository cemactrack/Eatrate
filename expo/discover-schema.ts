// Discover actual table schemas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('=== Discovering Table Schemas ===\n');

// Check profiles table
console.log('1. PROFILES TABLE:');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (profileError) {
  console.log('   Error:', profileError.message);
} else if (profile && profile.length > 0) {
  console.log('   Columns:', Object.keys(profile[0]).join(', '));
} else {
  // Try inserting minimal data to see what's required
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({ id: '00000000-0000-0000-0000-000000000000' });
  console.log('   Insert attempt:', insertError?.message || 'Success (table is empty)');
}

// Check restaurants table
console.log('\n2. RESTAURANTS TABLE:');
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('*')
  .limit(1);

if (restaurant && restaurant.length > 0) {
  console.log('   Columns:', Object.keys(restaurant[0]).join(', '));
  console.log('   Sample:', JSON.stringify(restaurant[0], null, 2));
}

// Check posts table
console.log('\n3. POSTS TABLE:');
const { data: post, error: postError } = await supabase
  .from('posts')
  .select('*')
  .limit(1);

if (postError) {
  console.log('   Error:', postError.message);
} else if (post && post.length > 0) {
  console.log('   Columns:', Object.keys(post[0]).join(', '));
} else {
  // Try inserting minimal data to see what's required
  const { error: insertError } = await supabase
    .from('posts')
    .insert({ 
      user_id: '11111111-1111-1111-1111-111111111111',
      text: 'test'
    });
  console.log('   Insert attempt:', insertError?.message || 'Table is empty');
}

console.log('\n=== Discovery Complete ===');
