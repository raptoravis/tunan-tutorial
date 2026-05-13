import { Hono } from 'hono';
import { rooms } from './routes/rooms.ts';
import { votes } from './routes/votes.ts';

export function buildApp(): Hono {
  const app = new Hono();
  app.get('/api/health', (c) => c.json({ ok: true }));
  app.route('/', rooms);
  app.route('/', votes);
  return app;
}
