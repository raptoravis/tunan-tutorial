import { Hono } from 'hono';
import { rooms } from './routes/rooms.ts';
import { votes } from './routes/votes.ts';
import { admin } from './routes/admin.ts';

export function buildApp(): Hono {
  const app = new Hono();
  app.get('/api/health', (c) => c.json({ ok: true }));
  app.route('/', rooms);
  app.route('/', votes);
  app.route('/', admin);
  return app;
}
