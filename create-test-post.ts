// Create a test post
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Creating test post...\n');

// Get first profile
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (!profiles || profiles.length === 0) {
  console.log('❌ No profiles found!');
  process.exit(1);
}

const userId = profiles[0].id;
console.log(`Using user: ${profiles[0].display_name} (${userId})\n`);

// Create a test post
console.log('Creating post...');
const { data: post, error } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    text: 'This is a test post created from the diagnostic script! 🎉',
    type: 'review',
  })
  .select();

if (error) {
  console.log('❌ Error:', error.message);
  console.log('   Code:', error.code);
  console.log('   Details:', error.details);
} else {
  console.log('✅ Post created successfully!');
  console.log('   Post:', post[0]);
  
  // Verify we can fetch it
  console.log('\nVerifying post can be fetched...');
  const { data: fetchedPosts, error: fetchError } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `);
  
  if (fetchError) {
    console.log('❌ Fetch error:', fetchError.message);
  } else {
    console.log(`✅ Fetched ${fetchedPosts?.length || 0} posts`);
    if (fetchedPosts && fetchedPosts.length > 0) {
      console.log('\nFirst post:');
      console.log('   Text:', fetchedPosts[0].text);
      console.log('   User:', fetchedPosts[0].profiles?.display_name);
      console.log('   Type:', fetchedPosts[0].type);
      console.log('   Created:', fetchedPosts[0].created_at);
    }
  }
}
