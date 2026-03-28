// Comprehensive diagnostic of all issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     COMPREHENSIVE SUPABASE DIAGNOSTIC                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Test 1: Environment Variables
console.log('📋 TEST 1: Environment Variables');
console.log('─────────────────────────────────');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ SET' : '❌ NOT SET');

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  console.log('\n❌ CRITICAL: Missing environment variables!');
  process.exit(1);
}

const key = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('\n✅ Supabase client created\n');

// Test 2: Check if tables exist
console.log('📋 TEST 2: Table Existence');
console.log('─────────────────────────────────');

const tables = ['profiles', 'restaurants', 'posts', 'comments'];
const tableStatus: Record<string, boolean> = {};

for (const table of tables) {
  const { error } = await supabase.from(table).select('id').limit(1);
  tableStatus[table] = !error;
  console.log(`${table}:`, tableStatus[table] ? '✅ EXISTS' : '❌ MISSING');
  if (error && error.code !== 'PGRST116') {
    console.log(`  Error: ${error.message}`);
  }
}

// Test 3: Check actual column names in each table
console.log('\n📋 TEST 3: Table Schemas');
console.log('─────────────────────────────────');

// Check restaurants
const { data: restaurantSample } = await supabase
  .from('restaurants')
  .select('*')
  .limit(1);

if (restaurantSample && restaurantSample.length > 0) {
  console.log('\n🏪 RESTAURANTS TABLE:');
  console.log('Columns:', Object.keys(restaurantSample[0]).join(', '));
  console.log('Sample data:', JSON.stringify(restaurantSample[0], null, 2));
}

// Check posts table structure by trying different column names
console.log('\n📝 POSTS TABLE:');
const postColumns = ['text', 'content', 'body', 'message'];
let postsColumnName = null;

for (const col of postColumns) {
  const { error } = await supabase
    .from('posts')
    .select(col)
    .limit(1);
  
  if (!error) {
    postsColumnName = col;
    console.log(`✅ Text column name: "${col}"`);
    break;
  }
}

if (!postsColumnName) {
  console.log('❌ Could not determine text column name');
  // Try to get any post to see structure
  const { data: postSample, error: postError } = await supabase
    .from('posts')
    .select('*')
    .limit(1);
  
  if (postSample && postSample.length > 0) {
    console.log('Actual columns:', Object.keys(postSample[0]).join(', '));
  } else if (postError) {
    console.log('Error:', postError.message);
  }
}

// Check profiles
console.log('\n👤 PROFILES TABLE:');
const { data: profileSample, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (profileError) {
  console.log('Error:', profileError.message);
} else if (profileSample && profileSample.length > 0) {
  console.log('Columns:', Object.keys(profileSample[0]).join(', '));
} else {
  console.log('⚠️  Table is empty');
}

// Test 4: Check Row Level Security
console.log('\n📋 TEST 4: Row Level Security (RLS)');
console.log('─────────────────────────────────');

for (const table of tables) {
  if (!tableStatus[table]) continue;
  
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .limit(1);
  
  if (error && error.code === 'PGRST301') {
    console.log(`${table}: ❌ RLS BLOCKING (no policy for SELECT)`);
  } else if (error) {
    console.log(`${table}: ⚠️  ${error.message}`);
  } else {
    console.log(`${table}: ✅ SELECT allowed`);
  }
}

// Test 5: Data counts
console.log('\n📋 TEST 5: Data Counts');
console.log('─────────────────────────────────');

const { count: restaurantCount } = await supabase
  .from('restaurants')
  .select('*', { count: 'exact', head: true });

const { count: postCount } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true });

const { count: profileCount } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true });

console.log(`Restaurants: ${restaurantCount ?? 0} records`);
console.log(`Posts: ${postCount ?? 0} records`);
console.log(`Profiles: ${profileCount ?? 0} records`);

// Test 6: Test the actual query used by the app
console.log('\n📋 TEST 6: App Query Simulation');
console.log('─────────────────────────────────');

console.log('\nTesting posts feed query (as used in app)...');
const { data: posts, error: postsError } = await supabase
  .from('posts')
  .select(`
    *,
    profiles!posts_user_id_fkey (
      id,
      display_name,
      avatar_url
    )
  `)
  .limit(5);

if (postsError) {
  console.log('❌ Posts query failed:', postsError.message);
  console.log('   Code:', postsError.code);
  console.log('   Details:', postsError.details);
} else {
  console.log(`✅ Posts query succeeded: ${posts?.length || 0} posts`);
  if (posts && posts.length > 0) {
    console.log('   Sample post structure:', Object.keys(posts[0]).join(', '));
  }
}

console.log('\nTesting restaurants query...');
const { data: restaurants, error: restaurantsError } = await supabase
  .from('restaurants')
  .select('*')
  .limit(5);

if (restaurantsError) {
  console.log('❌ Restaurants query failed:', restaurantsError.message);
} else {
  console.log(`✅ Restaurants query succeeded: ${restaurants?.length || 0} restaurants`);
}

// Summary
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     DIAGNOSTIC SUMMARY                                 ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const issues: string[] = [];
const warnings: string[] = [];

if (!tableStatus.profiles) issues.push('Profiles table missing');
if (!tableStatus.posts) issues.push('Posts table missing');
if (!tableStatus.restaurants) issues.push('Restaurants table missing');
if (postCount === 0) warnings.push('Posts table is empty');
if (profileCount === 0) warnings.push('Profiles table is empty');
if (restaurantCount === 0) warnings.push('Restaurants table is empty');
if (postsError) issues.push(`Posts query fails: ${postsError.message}`);

if (issues.length > 0) {
  console.log('🚨 CRITICAL ISSUES:');
  issues.forEach(issue => console.log(`   ❌ ${issue}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Database is properly configured.');
} else if (issues.length === 0) {
  console.log('\n✅ Configuration is correct, but database needs data.');
  console.log('   Run the seed script or sign up in the app to add data.');
}

console.log('\n');
