import { serve } from '@hono/node-server';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { openDb } from './db.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const dbFile = process.env.DB_FILE || 'data/polls.sqlite';

mkdirSync(dirname(dbFile), { recursive: true });
const db = openDb(dbFile);
const app = createApp(db);

serve({ fetch: app.fetch, port });
console.log(`voting-system listening on http://localhost:${port}`);
