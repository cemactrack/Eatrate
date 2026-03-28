import { supabaseAdmin } from './backend/supabase-admin';

async function diagnoseData() {
  console.log('🔍 Diagnosing Supabase data...\n');

  try {
    // Check restaurants
    console.log('📍 Checking restaurants table...');
    const { data: restaurants, error: restaurantsError, count: restaurantsCount } = await supabaseAdmin
      .from('restaurants')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (restaurantsError) {
      console.error('❌ Restaurants error:', restaurantsError);
    } else {
      console.log(`✅ Found ${restaurantsCount} restaurants`);
      console.log('Sample:', restaurants?.slice(0, 2));
    }

    // Check posts
    console.log('\n📝 Checking posts table...');
    const { data: posts, error: postsError, count: postsCount } = await supabaseAdmin
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(id, display_name, avatar_url)', { count: 'exact' })
      .limit(5);
    
    if (postsError) {
      console.error('❌ Posts error:', postsError);
    } else {
      console.log(`✅ Found ${postsCount} posts`);
      console.log('Sample:', posts?.slice(0, 2));
    }

    // Check profiles (users)
    console.log('\n👥 Checking profiles table...');
    const { data: profiles, error: profilesError, count: profilesCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`✅ Found ${profilesCount} profiles`);
      console.log('Sample:', profiles?.slice(0, 2));
    }

    // Check dishes (if table exists)
    console.log('\n🍽️ Checking dishes table...');
    const { data: dishes, error: dishesError, count: dishesCount } = await supabaseAdmin
      .from('dishes')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (dishesError) {
      console.error('❌ Dishes error:', dishesError.message);
      console.log('ℹ️  Dishes table might not exist - using external API fallback');
    } else {
      console.log(`✅ Found ${dishesCount} dishes`);
      console.log('Sample:', dishes?.slice(0, 2));
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

diagnoseData();
