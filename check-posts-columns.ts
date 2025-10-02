// Check exact posts table structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Checking posts table structure...\n');

// Try to insert a minimal post to see what columns are required/available
const testUserId = '11111111-1111-1111-1111-111111111111';

const { error } = await supabase
  .from('posts')
  .insert({
    user_id: testUserId,
    text: 'test',
    restaurant_id: '778ddada-57f0-4874-a1de-a213897591c3', // Use actual restaurant ID
  });

if (error) {
  console.log('Insert error:', error.message);
  console.log('Code:', error.code);
  console.log('Details:', error.details);
  console.log('Hint:', error.hint);
}

// Try without restaurant_id
console.log('\nTrying without restaurant_id...');
const { error: error2 } = await supabase
  .from('posts')
  .insert({
    user_id: testUserId,
    text: 'test',
  });

if (error2) {
  console.log('Insert error:', error2.message);
  console.log('Code:', error2.code);
} else {
  console.log('✅ Insert succeeded without restaurant_id');
  // Clean up
  await supabase.from('posts').delete().eq('user_id', testUserId);
}
