// Create profiles for existing auth users
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Creating missing profiles for auth users...\n');

// Get all auth users
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.log('❌ Error listing users:', authError.message);
  process.exit(1);
}

console.log(`Found ${authUsers.users.length} auth users\n`);

// Get existing profiles
const { data: existingProfiles } = await supabase
  .from('profiles')
  .select('id');

const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);

// Create profiles for users that don't have one
let created = 0;
let skipped = 0;

for (const user of authUsers.users) {
  if (existingProfileIds.has(user.id)) {
    console.log(`⏭️  Skipping ${user.email} - profile already exists`);
    skipped++;
    continue;
  }
  
  console.log(`Creating profile for ${user.email}...`);
  
  const displayName = user.email?.split('@')[0] || `User ${user.id.slice(0, 8)}`;
  
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: displayName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
    });
  
  if (insertError) {
    console.log(`   ❌ Error: ${insertError.message}`);
  } else {
    console.log(`   ✅ Profile created for ${user.email}`);
    created++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} profiles`);
console.log(`   Skipped: ${skipped} profiles (already existed)`);
console.log(`   Total users: ${authUsers.users.length}`);

// Verify
const { data: allProfiles } = await supabase
  .from('profiles')
  .select('id, display_name');

console.log(`\n✅ Total profiles now: ${allProfiles?.length || 0}`);
if (allProfiles && allProfiles.length > 0) {
  console.log('\nProfiles:');
  allProfiles.forEach(p => console.log(`   - ${p.display_name} (${p.id})`));
}
