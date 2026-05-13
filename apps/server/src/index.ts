import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { setDbPath } from './db.js';

setDbPath(process.env.DATABASE_URL ?? './data.db');

const port = Number(process.env.PORT ?? 4123);
const app = createApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
