const getAllowedOrigins = (): readonly string[] => {
  const baseOrigins = [
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, ''), // Remove trailing slash
    'exp://127.0.0.1:8081',
    'http://localhost:8081',
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean); // Remove undefined values
  
  // Add development origins if in development
  if (process.env.NODE_ENV === 'development') {
    baseOrigins.push(
      'http://localhost:19006', // Expo web dev server
      'http://127.0.0.1:19006'
    );
  }
  
  return baseOrigins as readonly string[];
};

const ALLOWED_ORIGINS = getAllowedOrigins();

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With';

function buildCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Vary': 'Origin',
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export async function OPTIONS(req: Request) {
  console.log('[Health Check][CORS][OPTIONS] Preflight for /api/health');
  return new Response(null, {
    status: 204,
    headers: {
      ...buildCorsHeaders(req),
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(req: Request) {
  console.log('[Health Check] GET /api/health');
  const body = { ok: true, timestamp: new Date().toISOString() } as const;
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(req),
    },
  });
}
