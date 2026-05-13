import { Hono } from 'hono';
import { db } from '../db.js';
import { newVoteId, newAdminToken } from '../ids.js';
import { ensureSession } from '../sessions.js';

export const votesRouter = new Hono();

type VoteRow = { id: string; title: string; closed_at: string | null };
type OptionRow = { idx: number; label: string };
type CountRow = { option_idx: number; n: number };
type SessionRow = { option_idx: number };

votesRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const voteRow = db
    .prepare('SELECT id, title, closed_at FROM votes WHERE id = ?')
    .get(id) as VoteRow | undefined;
  if (!voteRow) return c.json({ error: 'not_found' }, 404);

  const session = ensureSession(c);

  const optionRows = db
    .prepare('SELECT idx, label FROM vote_options WHERE vote_id = ? ORDER BY idx')
    .all(id) as OptionRow[];
  const counts = db
    .prepare(
      'SELECT option_idx, COUNT(*) as n FROM vote_sessions WHERE vote_id = ? GROUP BY option_idx',
    )
    .all(id) as CountRow[];
  const countByIdx = new Map<number, number>();
  for (const c of counts) countByIdx.set(c.option_idx, c.n);

  const youRow = db
    .prepare(
      'SELECT option_idx FROM vote_sessions WHERE vote_id = ? AND session_token = ?',
    )
    .get(id, session) as SessionRow | undefined;

  return c.json({
    id: voteRow.id,
    title: voteRow.title,
    closed: voteRow.closed_at !== null,
    you_voted_idx: youRow?.option_idx ?? null,
    options: optionRows.map((o) => ({
      idx: o.idx,
      label: o.label,
      count: countByIdx.get(o.idx) ?? 0,
    })),
  });
});

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
