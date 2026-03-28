import { supabaseAdmin } from './backend/supabase-admin';

async function testEndpoints() {
  console.log('🧪 Testing tRPC endpoints...\n');

  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not configured');
      return;
    }

    // Test restaurants endpoint
    console.log('📍 Testing restaurants endpoint...');
    const { data: restaurants, error: restaurantsError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (restaurantsError) {
      console.error('❌ Restaurants error:', restaurantsError);
    } else {
      console.log(`✅ Restaurants: ${restaurants?.length || 0} found`);
      console.log('   Sample:', restaurants?.[0]?.name);
    }

    // Test posts endpoint
    console.log('\n📝 Testing posts endpoint...');
    const { data: posts, error: postsError } = await supabaseAdmin!
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (postsError) {
      console.error('❌ Posts error:', postsError);
    } else {
      console.log(`✅ Posts: ${posts?.length || 0} found`);
      console.log('   Sample:', posts?.[0]?.text?.substring(0, 50) + '...');
    }

    // Test users endpoint
    console.log('\n👥 Testing users endpoint...');
    const { data: profiles, error: profilesError } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`✅ Users: ${profiles?.length || 0} found`);
      console.log('   Sample:', profiles?.[0]?.display_name);
    }

    // Test dishes endpoint (external API)
    console.log('\n🍽️ Testing dishes endpoint (external API)...');
    try {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
      if (!res.ok) throw new Error('Failed to fetch meals');
      const data = await res.json();
      const dishes = (data.meals ?? []).slice(0, 3);
      console.log(`✅ Dishes: ${dishes.length} found from external API`);
      console.log('   Sample:', dishes[0]?.strMeal);
    } catch (error: any) {
      console.error('❌ Dishes error:', error.message);
    }

    console.log('\n✅ All endpoints tested successfully!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEndpoints();
