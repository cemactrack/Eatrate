// Check profiles table actual schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Checking profiles table schema...\n');

// Try to insert a minimal profile to see what columns are available
const testUserId = '11111111-1111-1111-1111-111111111111';

const { error } = await supabase
  .from('profiles')
  .insert({
    id: testUserId,
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
  });

if (error) {
  console.log('Insert with bio error:', error.message);
  console.log('Code:', error.code);
  
  // Try without bio
  const { error: error2 } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    });
  
  if (error2) {
    console.log('\nInsert without bio error:', error2.message);
    console.log('Code:', error2.code);
  } else {
    console.log('\n✅ Insert succeeded without bio column');
    
    // Get the profile to see what columns exist
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (data) {
      console.log('\nProfiles table columns:', Object.keys(data).join(', '));
    }
    
    // Clean up
    await supabase.from('profiles').delete().eq('id', testUserId);
  }
}
