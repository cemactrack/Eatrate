// Get actual schema by querying pg_catalog
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

console.log('Querying actual table schemas from PostgreSQL catalog...\n');

console.log('Testing column availability...\n');

// Try to select with common column names
const commonColumns = [
  'id', 'user_id', 'text', 'content', 'type', 'status',
  'images', 'videos', 'tags',
  'rating_food', 'rating_service', 'rating_ambiance', 'rating_cleanliness', 'rating_overall',
  'likes_count', 'comments_count', 'shares_count', 'views_count',
  'created_at', 'updated_at'
];

console.log('POSTS TABLE - Testing common columns:');
for (const col of commonColumns) {
  const { error } = await supabase
    .from('posts')
    .select(col)
    .limit(0);
  
  if (!error) {
    console.log(`  ✅ ${col}`);
  }
}

console.log('\nPROFILES TABLE - Testing common columns:');
const profileColumns = [
  'id', 'email', 'display_name', 'avatar_url', 'bio',
  'badges', 'preferences', 'followers_count', 'following_count', 'posts_count',
  'created_at', 'updated_at'
];

for (const col of profileColumns) {
  const { error } = await supabase
    .from('profiles')
    .select(col)
    .limit(0);
  
  if (!error) {
    console.log(`  ✅ ${col}`);
  }
}
