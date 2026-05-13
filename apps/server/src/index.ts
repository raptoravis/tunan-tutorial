import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { db } from './db.js';

export const app = new Hono();

app.get('/api/health', (c) => {
  let dbStatus = 'fail';
  try {
    const row = db.prepare('SELECT 1 as one').get() as { one: number } | undefined;
    if (row?.one === 1) dbStatus = 'ok';
  } catch {
    dbStatus = 'fail';
  }
  return c.json({ ok: true, db: dbStatus });
});

const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') ?? '');

if (isEntry) {
  const port = Number(process.env.PORT ?? 4123);
  console.log(`Node ${process.version} — server starting on :${port}`);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`listening on ${info.port}`);
  });
}
