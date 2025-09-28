export default async function handler(_req: Request) {
  return new Response(
    JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
    { headers: { 'content-type': 'application/json' } }
  );
}