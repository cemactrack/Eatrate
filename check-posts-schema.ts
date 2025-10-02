// Check posts table schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Checking posts table schema...\n');

// Try to get one post with all columns
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else if (data && data.length > 0) {
  console.log('Posts table columns:');
  console.log(Object.keys(data[0]));
  console.log('\nSample post:');
  console.log(JSON.stringify(data[0], null, 2));
} else {
  console.log('Posts table is empty. Let me check the table structure...');
  
  // Try with minimal select to see what columns exist
  const { error: structError } = await supabase
    .from('posts')
    .select('id')
    .limit(1);
    
  if (structError) {
    console.error('Table might not exist:', structError);
  } else {
    console.log('Table exists but is empty.');
  }
}
