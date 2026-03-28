import { supabaseAdmin } from './backend/supabase-admin';

async function seedPosts() {
  console.log('🌱 Seeding sample posts...\n');

  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not configured');
      return;
    }

    // Get existing user ID
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ No profiles found. Please create a user first.');
      return;
    }

    const userId = profiles[0].id;
    console.log(`✅ Using user ID: ${userId}`);

    // Get existing restaurants
    const { data: restaurants } = await supabaseAdmin!
      .from('restaurants')
      .select('id, name')
      .limit(4);
    
    console.log(`✅ Found ${restaurants?.length || 0} restaurants`);

    // Sample posts data
    const samplePosts = [
      {
        user_id: userId,
        text: 'Amazing food experience at this restaurant! The flavors were incredible and the service was top-notch. Highly recommend the grilled fish!',
        type: 'review',
      },
      {
        user_id: userId,
        text: 'Just had the best Ndolé I\'ve ever tasted! The chef really knows how to balance the flavors. Will definitely come back for more.',
        type: 'review',
      },
      {
        user_id: userId,
        text: 'Great atmosphere and delicious food. The poulet DG was perfectly cooked and the portions were generous. A must-try!',
        type: 'review',
      },
      {
        user_id: userId,
        text: 'Wonderful dining experience! The staff was friendly and the food arrived quickly. The plantains were crispy and delicious.',
        type: 'review',
      },
      {
        user_id: userId,
        text: 'This place never disappoints! Fresh ingredients, authentic flavors, and reasonable prices. My go-to spot for Cameroonian cuisine.',
        type: 'review',
      },
    ];

    // Insert posts
    const { data: insertedPosts, error } = await supabaseAdmin!
      .from('posts')
      .insert(samplePosts)
      .select('id, text');

    if (error) {
      console.error('❌ Error inserting posts:', error);
      return;
    }

    console.log(`\n✅ Successfully created ${insertedPosts?.length || 0} posts!`);
    console.log('\nSample posts:');
    insertedPosts?.slice(0, 2).forEach((post, i) => {
      console.log(`${i + 1}. ${post.text.substring(0, 50)}...`);
    });

    // Verify posts were created
    const { data: allPosts, count } = await supabaseAdmin!
      .from('posts')
      .select('*', { count: 'exact' });
    
    console.log(`\n📊 Total posts in database: ${count}`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

seedPosts();
