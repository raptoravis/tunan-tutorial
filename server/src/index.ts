import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { db } from './db.js';
import { initSchema } from './schema.js';
import { createPoll, ValidationError } from './polls.js';

initSchema(db);

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

app.post('/api/polls', async (c) => {
  let input: { title?: string; options?: string[] };
  try {
    input = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json' }, 400);
  }
  try {
    const { id } = createPoll({
      title: input.title ?? '',
      options: input.options ?? [],
    });
    return c.json({ id, url: `/poll/${id}` }, 201);
  } catch (e) {
    if (e instanceof ValidationError) return c.json({ error: e.message }, 400);
    throw e;
  }
});

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const port = 4123;
  serve({ fetch: app.fetch, port });
  console.log(`server listening on :${port}`);
}
