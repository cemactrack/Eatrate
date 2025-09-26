export async function GET() {
  console.log('[Health Check] API route is working');
  return new Response(JSON.stringify({ 
    status: 'ok', 
    message: 'API routes are working',
    timestamp: new Date().toISOString() 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}