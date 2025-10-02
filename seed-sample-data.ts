// Seed sample data to Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('=== Seeding Sample Data ===\n');

// Step 1: Create a sample user profile
console.log('Step 1: Creating sample user profile...');
const sampleUserId = '11111111-1111-1111-1111-111111111111';

const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: sampleUserId,
    email: 'demo@eatrate.com',
    display_name: 'Demo User',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
    bio: 'Food enthusiast and restaurant reviewer',
    badges: ['Top Reviewer'],
    preferences: { cuisines: ['Italian', 'Asian'], dietaryRestrictions: [], priceRange: ['$$', '$$$'] },
  });

if (profileError) {
  console.error('❌ Profile error:', profileError.message);
} else {
  console.log('✅ Sample user profile created');
}

// Step 2: Get existing restaurants
console.log('\nStep 2: Getting existing restaurants...');
const { data: restaurants } = await supabase
  .from('restaurants')
  .select('id, name')
  .limit(4);

if (!restaurants || restaurants.length === 0) {
  console.log('⚠️  No restaurants found. Posts will be created without restaurant links.');
}

// Step 3: Create sample posts
console.log('\nStep 3: Creating sample posts...');
const samplePosts = [
  {
    user_id: sampleUserId,
    restaurant_id: restaurants?.[0]?.id || null,
    content: 'Amazing dining experience! The food was absolutely delicious and the service was top-notch. Highly recommend the signature dishes.',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'],
    type: 'review',
    status: 'published',
    rating_food: 5,
    rating_service: 5,
    rating_ambiance: 4,
    rating_cleanliness: 5,
    rating_overall: 4.7,
    tags: ['delicious', 'recommended', 'must-try'],
    likes_count: 15,
    comments_count: 3,
    shares_count: 2,
    views_count: 45,
  },
  {
    user_id: sampleUserId,
    restaurant_id: restaurants?.[1]?.id || null,
    content: 'Great atmosphere and authentic flavors. The chef really knows how to balance spices perfectly. Will definitely come back!',
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'],
    type: 'review',
    status: 'published',
    rating_food: 4,
    rating_service: 4,
    rating_ambiance: 5,
    rating_cleanliness: 4,
    rating_overall: 4.3,
    tags: ['authentic', 'great-ambiance'],
    likes_count: 8,
    comments_count: 1,
    shares_count: 0,
    views_count: 23,
  },
  {
    user_id: sampleUserId,
    restaurant_id: restaurants?.[2]?.id || null,
    content: 'Perfect spot for a casual dinner. Good portions and reasonable prices. The staff was very friendly and attentive.',
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'],
    type: 'photo',
    status: 'published',
    rating_food: 4,
    rating_service: 5,
    rating_ambiance: 3,
    rating_cleanliness: 4,
    rating_overall: 4.0,
    tags: ['casual', 'good-value'],
    likes_count: 12,
    comments_count: 2,
    shares_count: 1,
    views_count: 34,
  },
];

const { data: insertedPosts, error: postsError } = await supabase
  .from('posts')
  .insert(samplePosts)
  .select('id');

if (postsError) {
  console.error('❌ Posts error:', postsError.message);
  console.error('   Details:', postsError);
} else {
  console.log(`✅ Created ${insertedPosts?.length || 0} sample posts`);
}

console.log('\n=== Seeding Complete ===\n');
console.log('Summary:');
console.log('- 1 sample user profile');
console.log(`- ${insertedPosts?.length || 0} sample posts`);
console.log(`- Linked to ${restaurants?.length || 0} existing restaurants`);
console.log('\nYou can now restart your app and see the data!');
