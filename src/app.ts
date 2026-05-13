import { Hono } from 'hono';
import type { DB } from './db.js';
import { pollsRoutes } from './routes/polls.js';

export function createApp(db: DB) {
  const app = new Hono();
  app.route('/', pollsRoutes(db));
  return app;
}
