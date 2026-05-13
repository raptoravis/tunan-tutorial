import { Hono } from 'hono';
import { pollsRoute } from './routes/polls.js';

export function createApp(): Hono {
  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/api/polls', pollsRoute);
  return app;
}
