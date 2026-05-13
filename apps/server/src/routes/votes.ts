import { Hono } from 'hono';
import { db } from '../db.js';
import { newVoteId, newAdminToken } from '../ids.js';

export const votesRouter = new Hono();

type CreateBody = { title?: unknown; options?: unknown };

function validateCreate(body: CreateBody):
  | { ok: true; title: string; options: string[] }
  | { ok: false; error: string } {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 1 || title.length > 80) {
    return { ok: false, error: 'invalid_title' };
  }
  if (!Array.isArray(body.options)) {
    return { ok: false, error: 'invalid_options' };
  }
  if (body.options.length < 2 || body.options.length > 10) {
    return { ok: false, error: 'option_count_out_of_range' };
  }
  const options: string[] = [];
  for (const raw of body.options) {
    if (typeof raw !== 'string') return { ok: false, error: 'invalid_option_type' };
    const s = raw.trim();
    if (s.length < 1 || s.length > 40) return { ok: false, error: 'invalid_option_length' };
    options.push(s);
  }
  return { ok: true, title, options };
}

votesRouter.post('/', async (c) => {
  let body: CreateBody;
  try {
    body = (await c.req.json()) as CreateBody;
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const v = validateCreate(body);
  if (!v.ok) return c.json({ error: v.error }, 400);

  const insertVote = db.prepare('INSERT INTO votes (id, title, admin_token) VALUES (?, ?, ?)');
  const insertOpt = db.prepare(
    'INSERT INTO vote_options (vote_id, idx, label) VALUES (?, ?, ?)',
  );
  const admin_token = newAdminToken();

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newVoteId();
    db.exec('BEGIN');
    try {
      insertVote.run(id, v.title, admin_token);
      v.options.forEach((label, idx) => insertOpt.run(id, idx, label));
      db.exec('COMMIT');
      return c.json({ id, admin_token });
    } catch (e: unknown) {
      db.exec('ROLLBACK');
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('UNIQUE')) {
        return c.json({ error: 'db_error', detail: msg }, 500);
      }
    }
  }
  return c.json({ error: 'id_collision_retries_exceeded' }, 500);
});
