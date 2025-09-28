import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

export const config = { runtime: 'edge' }; // remove this line if you prefer Node runtime

export default async function handler(req: Request) {
  return new Response(
    JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
    { headers: { 'content-type': 'application/json' } }
  );
}
