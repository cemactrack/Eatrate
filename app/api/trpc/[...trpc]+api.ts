import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

console.log('[API Route] tRPC API route initialized');

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
  return handleTRPCRequest(request);
}

async function handleTRPCRequest(request: Request) {
  console.log('[tRPC API] Request:', request.method, request.url);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        console.error(`[tRPC Error] ${path}:`, error);
      },
    });
    
    console.log('[tRPC API] Response status:', response.status);
    return response;
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}