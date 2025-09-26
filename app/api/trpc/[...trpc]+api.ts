import honoApp from '@/backend/hono';

// Log API route initialization
console.log('[API Route] tRPC API route initialized');

export async function GET(request: Request) {
  console.log('[API Route] GET request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Route] GET response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  console.log('[API Route] POST request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Route] POST response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  console.log('[API Route] PUT request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Route] PUT response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] PUT error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request) {
  console.log('[API Route] DELETE request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Route] DELETE response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function OPTIONS(request: Request) {
  console.log('[API Route] OPTIONS request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Route] OPTIONS response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] OPTIONS error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}