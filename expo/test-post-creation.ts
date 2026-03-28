// Test creating a post with actual user
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Testing post creation...\n');

// First, check if there are any users in auth.users
console.log('Step 1: Checking for existing users...');
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.log('❌ Error listing users:', authError.message);
} else {
  console.log(`Found ${authUsers.users.length} auth users`);
  if (authUsers.users.length > 0) {
    console.log('First user:', authUsers.users[0].id, authUsers.users[0].email);
  }
}

// Check profiles
console.log('\nStep 2: Checking profiles...');
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('*');

if (profilesError) {
  console.log('❌ Error:', profilesError.message);
} else {
  console.log(`Found ${profiles?.length || 0} profiles`);
  if (profiles && profiles.length > 0) {
    console.log('First profile:', profiles[0]);
  }
}

// Try to create a post if we have a user
if (authUsers && authUsers.users.length > 0) {
  const userId = authUsers.users[0].id;
  
  console.log('\nStep 3: Attempting to create a test post...');
  console.log('Using user_id:', userId);
  
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      text: 'Test post from diagnostic script',
      type: 'review',
    })
    .select();
  
  if (postError) {
    console.log('❌ Error creating post:', postError.message);
    console.log('   Code:', postError.code);
    console.log('   Details:', postError.details);
    console.log('   Hint:', postError.hint);
  } else {
    console.log('✅ Post created successfully!');
    console.log('   Post data:', post);
    
    // Clean up
    if (post && post[0]) {
      await supabase.from('posts').delete().eq('id', post[0].id);
      console.log('   (Test post cleaned up)');
    }
  }
} else {
  console.log('\n⚠️  No users found. You need to sign up in the app first!');
  console.log('   Go to your app and create an account.');
}

// Check if posts table has id column
console.log('\nStep 4: Checking posts table structure...');
const { error: idError } = await supabase
  .from('posts')
  .select('id')
  .limit(0);

if (idError) {
  console.log('❌ Posts table missing id column!');
  console.log('   This is a critical issue.');
} else {
  console.log('✅ Posts table has id column');
}
