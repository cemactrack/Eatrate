import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

console.log('[API Route] tRPC API route initialized');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-trpc-source',
  'Access-Control-Max-Age': '86400',
};

export async function GET(request: Request) {
  return handleTRPCRequest(request);
}

export async function POST(request: Request) {
  return handleTRPCRequest(request);
}

export async function PUT(request: Request) {
  return handleTRPCRequest(request);
}

export async function DELETE(request: Request) {
  return handleTRPCRequest(request);
}

export async function OPTIONS(request: Request) {
  console.log('[tRPC API] CORS preflight request');
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function handleTRPCRequest(request: Request) {
  const url = new URL(request.url);
  console.log('[tRPC API] Request:', request.method, url.pathname + url.search);
  console.log('[tRPC API] Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: ({ req }) => createContext({ req }),
      onError: ({ error, path, input }) => {
        console.error(`[tRPC Error] ${path}:`, {
          error: error.message,
          code: error.code,
          input,
          stack: error.stack,
        });
      },
    });
    
    console.log('[tRPC API] Response status:', response.status);
    
    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('[tRPC API] Handler error:', error);
    return new Response(JSON.stringify({ 
      error: 'tRPC handler error',
      message: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}