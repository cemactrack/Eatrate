// Test API endpoints directly
const API_URL = 'http://localhost:8082';

console.log('Testing API endpoints...\n');

// Test 1: Health check
console.log('Test 1: Health Check');
try {
  const response = await fetch(`${API_URL}/api`);
  const data = await response.json();
  console.log('✅ Server is running:', data.message);
} catch (error: any) {
  console.log('❌ Server not responding:', error.message);
  console.log('   Make sure the server is running on port 8082');
  process.exit(1);
}

// Test 2: Restaurants endpoint
console.log('\nTest 2: Restaurants List');
try {
  const response = await fetch(`${API_URL}/api/trpc/restaurants.list`);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (error: any) {
  console.log('❌ Error:', error.message);
}

// Test 3: Posts feed endpoint
console.log('\nTest 3: Posts Feed');
try {
  const response = await fetch(`${API_URL}/api/trpc/posts.feed?input=${encodeURIComponent(JSON.stringify({ type: 'recent' }))}`);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (error: any) {
  console.log('❌ Error:', error.message);
}

// Test 4: Users list endpoint
console.log('\nTest 4: Users List');
try {
  const response = await fetch(`${API_URL}/api/trpc/users.list`);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (error: any) {
  console.log('❌ Error:', error.message);
}

// Test 5: Dishes list endpoint
console.log('\nTest 5: Dishes List');
try {
  const response = await fetch(`${API_URL}/api/trpc/dishes.list`);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (error: any) {
  console.log('❌ Error:', error.message);
}
