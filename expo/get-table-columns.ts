// Get actual table columns from Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Querying table schema from information_schema...\n');

// Query the information_schema to get column names
const { data, error } = await supabase
  .from('information_schema.columns')
  .select('column_name, data_type')
  .eq('table_name', 'posts')
  .eq('table_schema', 'public');

if (error) {
  console.error('Error querying schema:', error);
  console.log('\nTrying alternative method...');
  
  // Try inserting a test post to see what columns are required
  const { error: insertError } = await supabase
    .from('posts')
    .insert({
      text: 'Test post',
      user_id: '00000000-0000-0000-0000-000000000000',
    });
  
  if (insertError) {
    console.log('Insert error reveals column info:', insertError);
  }
} else {
  console.log('Posts table columns:');
  data?.forEach((col: any) => {
    console.log(`  - ${col.column_name} (${col.data_type})`);
  });
}
