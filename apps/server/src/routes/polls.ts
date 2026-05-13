import { Hono } from 'hono';
import { getDb } from '../db.js';
import { newPollId, newToken } from '../lib/id.js';
import { OWNER_COOKIE, VOTER_COOKIE, getCookie, setCookie, ensureVoterId } from '../lib/cookies.js';

const TITLE_MAX = 100;
const OPT_MIN = 2;
const OPT_MAX = 10;

interface CreateBody {
  title?: unknown;
  options?: unknown;
  deadline_at?: unknown;
}

interface VoteBody {
  option_id?: unknown;
}

export const pollsRoute = new Hono();

pollsRoute.post('/', async (c) => {
  let body: CreateBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length === 0) return c.json({ error: 'title_required' }, 400);
  if (title.length > TITLE_MAX) return c.json({ error: 'title_too_long' }, 400);

  if (!Array.isArray(body.options)) return c.json({ error: 'options_required' }, 400);
  const opts = body.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (opts.some((o) => o.length === 0)) return c.json({ error: 'option_empty' }, 400);
  if (opts.length < OPT_MIN) return c.json({ error: 'options_min' }, 400);
  if (opts.length > OPT_MAX) return c.json({ error: 'options_max' }, 400);
  if (new Set(opts).size !== opts.length) return c.json({ error: 'options_duplicate' }, 400);

  let deadline: string | null = null;
  if (body.deadline_at != null) {
    if (typeof body.deadline_at !== 'string') return c.json({ error: 'deadline_invalid' }, 400);
    const d = new Date(body.deadline_at);
    if (isNaN(d.getTime())) return c.json({ error: 'deadline_invalid' }, 400);
    deadline = d.toISOString();
  }

  const db = getDb();
  const id = newPollId();
  const ownerToken = newToken();
  const now = new Date().toISOString();

  const insertPoll = db.prepare(
    'INSERT INTO polls (id, title, deadline_at, owner_token, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const insertOpt = db.prepare(
    'INSERT INTO poll_options (id, poll_id, label, position) VALUES (?, ?, ?, ?)',
  );

  insertPoll.run(id, title, deadline, ownerToken, now);
  for (let i = 0; i < opts.length; i++) {
    insertOpt.run(newToken(), id, opts[i], i);
  }

  setCookie(c, OWNER_COOKIE, ownerToken);
  return c.json({ id });
});

pollsRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  const poll = db
    .prepare('SELECT id, title, deadline_at, owner_token FROM polls WHERE id = ?')
    .get(id) as
    | { id: string; title: string; deadline_at: string | null; owner_token: string }
    | undefined;
  if (!poll) return c.json({ error: 'not_found' }, 404);

  const options = db
    .prepare('SELECT id, label, position FROM poll_options WHERE poll_id = ? ORDER BY position')
    .all(id) as Array<{ id: string; label: string; position: number }>;

  const ownerCookie = getCookie(c, OWNER_COOKIE);
  const is_owner = ownerCookie != null && ownerCookie === poll.owner_token;

  const voterId = getCookie(c, VOTER_COOKIE);
  let your_option_id: string | null = null;
  if (voterId) {
    const row = db
      .prepare('SELECT option_id FROM votes WHERE poll_id = ? AND voter_id = ?')
      .get(id, voterId) as { option_id: string } | undefined;
    if (row) your_option_id = row.option_id;
  }

  const closed = poll.deadline_at != null && new Date(poll.deadline_at).getTime() < Date.now();

  const counts = db
    .prepare('SELECT option_id, COUNT(*) as cnt FROM votes WHERE poll_id = ? GROUP BY option_id')
    .all(id) as Array<{ option_id: string; cnt: number }>;
  const countByOption = new Map(counts.map((r) => [r.option_id, r.cnt]));
  const total_votes = counts.reduce((s, r) => s + r.cnt, 0);
  const tallies = options.map((o) => {
    const count = countByOption.get(o.id) ?? 0;
    const percent = total_votes === 0 ? 0 : Math.round((count / total_votes) * 1000) / 10;
    return { option_id: o.id, count, percent };
  });

  return c.json({
    id: poll.id,
    title: poll.title,
    deadline_at: poll.deadline_at,
    options: options.map((o) => ({ id: o.id, label: o.label, position: o.position })),
    is_owner,
    your_option_id,
    closed,
    tallies,
    total_votes,
  });
});

pollsRoute.post('/:id/votes', async (c) => {
  const pollId = c.req.param('id');
  let body: VoteBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  if (typeof body.option_id !== 'string' || body.option_id.length === 0) {
    return c.json({ error: 'option_required' }, 400);
  }

  const db = getDb();
  const poll = db
    .prepare('SELECT deadline_at FROM polls WHERE id = ?')
    .get(pollId) as { deadline_at: string | null } | undefined;
  if (!poll) return c.json({ error: 'not_found' }, 404);

  if (poll.deadline_at && new Date(poll.deadline_at).getTime() < Date.now()) {
    return c.json({ error: 'poll_closed' }, 409);
  }

  const opt = db
    .prepare('SELECT id FROM poll_options WHERE poll_id = ? AND id = ?')
    .get(pollId, body.option_id) as { id: string } | undefined;
  if (!opt) return c.json({ error: 'option_not_in_poll' }, 400);

  const voterId = ensureVoterId(c);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO votes (poll_id, voter_id, option_id, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(poll_id, voter_id) DO UPDATE SET option_id = excluded.option_id, updated_at = excluded.updated_at`,
  ).run(pollId, voterId, body.option_id, now);

  return c.json({ ok: true, option_id: body.option_id });
});

pollsRoute.delete('/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();
  const poll = db
    .prepare('SELECT owner_token FROM polls WHERE id = ?')
    .get(id) as { owner_token: string } | undefined;
  if (!poll) return c.json({ error: 'not_found' }, 404);

  const ownerCookie = getCookie(c, OWNER_COOKIE);
  if (!ownerCookie || ownerCookie !== poll.owner_token) {
    return c.json({ error: 'forbidden' }, 403);
  }

  db.prepare('DELETE FROM votes WHERE poll_id = ?').run(id);
  db.prepare('DELETE FROM poll_options WHERE poll_id = ?').run(id);
  db.prepare('DELETE FROM polls WHERE id = ?').run(id);

  return c.json({ ok: true });
});
