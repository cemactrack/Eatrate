// Server-only configuration (no React Native dependencies)
// This file is safe to import in Bun server context

export function getAllowedOrigins(): string[] {
  return [
    'https://eatrate.vercel.app',
    'https://eatrate-api.vercel.app',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8083',
    'http://localhost:19006',
    'exp://127.0.0.1:8081',
    'exp://127.0.0.1:8083',
    'exp://127.0.0.1:3000',
  ];
}

export function getServerPort(): number {
  return parseInt(process.env.PORT || '3000', 10);
}
