import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initDb } from './db.js';

const PORT = Number(process.env.PORT ?? 4123);

initDb();
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
