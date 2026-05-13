import { serve } from '@hono/node-server';
import { buildApp } from './app.ts';
import { openDb } from './db.ts';

const port = Number(process.env.PORT ?? 4123);
const dbPath = process.env.VOTING_DB_PATH ?? './data/voting.sqlite';

openDb(dbPath);
const app = buildApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(JSON.stringify({ event: 'server.start', port: info.port, db: dbPath }));
});
