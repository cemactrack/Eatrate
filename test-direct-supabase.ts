// Test Supabase with exact key
const SUPABASE_URL = 'https://wdfukmxvpvytvxrogqiu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZnVrbXh2cHZ5dHZ4cm9ncWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NDMyMzYsImV4cCI6MjA3NDUxOTIzNn0.3KFy9y6YbDrD5--IOPLfshpb-tjraPDdkYYQBubONzo';

async function testDirect() {
  console.log('Testing direct REST API call...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?limit=1`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
    
    console.log('Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response:', text.substring(0, 200));
    
    if (response.ok) {
      console.log('\n✅ Keys are VALID! The issue is elsewhere.');
    } else {
      console.log('\n❌ Keys are INVALID or project has issues.');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testDirect();
