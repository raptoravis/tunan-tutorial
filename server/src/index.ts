import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { db } from './db.js';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  db.exec('SELECT 1');
  const port = 4123;
  serve({ fetch: app.fetch, port });
  console.log(`server listening on :${port}`);
}
