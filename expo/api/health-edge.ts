export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Return health check response
  const response = {
    ok: true,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers
  });
}