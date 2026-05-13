import { Hono } from 'hono';
import { z } from 'zod';
import type { DB } from '../db.js';
import { newPollId, newOptionId, newAdminToken } from '../ids.js';
import { createPollSchema, validateDeadlineMs } from '../validation.js';
import { renderCreatePage } from '../views/create.js';
import { renderPollPage } from '../views/poll.js';
import { sessionMiddleware, getSid } from '../session.js';

const voteSchema = z.object({
  optionId: z.string().min(1),
  nickname: z.string().trim().max(20).optional(),
});

interface PollRow {
  id: string;
  question: string;
  deadline_ms: number;
  admin_token: string;
  closed_at_ms: number | null;
}

interface OptionRow {
  id: string;
  label: string;
}

function pollIsClosed(p: { deadline_ms: number; closed_at_ms: number | null }, nowMs: number): boolean {
  if (p.closed_at_ms !== null) return true;
  return nowMs >= p.deadline_ms;
}

export function pollsRoutes(db: DB) {
  const r = new Hono();
  r.use('*', sessionMiddleware);

  r.get('/', (c) => c.html(renderCreatePage()));

  r.post('/api/polls', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    const parsed = createPollSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_input', issues: parsed.error.flatten() }, 400);
    }
    const input = parsed.data;
    const deadlineMs = new Date(input.deadline).getTime();
    const now = Date.now();
    const reason = validateDeadlineMs(deadlineMs, now);
    if (reason) return c.json({ error: reason }, 400);

    const pollId = newPollId();
    const adminToken = newAdminToken();

    const insertPoll = db.prepare(
      `INSERT INTO polls (id, question, deadline_ms, admin_token, public_details, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertOption = db.prepare(
      `INSERT INTO options (id, poll_id, label, created_at_ms) VALUES (?, ?, ?, ?)`,
    );

    db.exec('BEGIN');
    try {
      insertPoll.run(pollId, input.question, deadlineMs, adminToken, input.publicDetails ? 1 : 0, now);
      for (const label of input.options) {
        insertOption.run(newOptionId(), pollId, label, now);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    const origin = new URL(c.req.url).origin;
    return c.json(
      {
        pollId,
        adminToken,
        voteUrl: `${origin}/v/${pollId}`,
        adminUrl: `${origin}/m/${pollId}?token=${adminToken}`,
      },
      201,
    );
  });

  r.post('/api/polls/:id/vote', async (c) => {
    const pollId = c.req.param('id');
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);
    const { optionId, nickname } = parsed.data;

    const poll = db
      .prepare(`SELECT id, deadline_ms, closed_at_ms FROM polls WHERE id = ?`)
      .get(pollId) as { id: string; deadline_ms: number; closed_at_ms: number | null } | undefined;
    if (!poll) return c.json({ error: 'poll_not_found' }, 404);

    const now = Date.now();
    if (pollIsClosed(poll, now)) return c.json({ error: 'poll_closed' }, 409);

    const opt = db
      .prepare(`SELECT id FROM options WHERE id = ? AND poll_id = ?`)
      .get(optionId, pollId) as { id: string } | undefined;
    if (!opt) return c.json({ error: 'option_not_found' }, 404);

    const sid = getSid(c);
    db.prepare(
      `INSERT INTO votes (poll_id, session_id, option_id, nickname, voted_at_ms)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(poll_id, session_id) DO UPDATE SET
         option_id = excluded.option_id,
         nickname  = excluded.nickname,
         voted_at_ms = excluded.voted_at_ms`,
    ).run(pollId, sid, optionId, nickname ?? null, now);

    return c.json({ optionId, nickname: nickname ?? null });
  });

  r.get('/v/:id', (c) => {
    const id = c.req.param('id');
    const poll = db
      .prepare(`SELECT id, question, deadline_ms, closed_at_ms FROM polls WHERE id = ?`)
      .get(id) as { id: string; question: string; deadline_ms: number; closed_at_ms: number | null } | undefined;
    if (!poll) return c.text('Not found', 404);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as unknown as OptionRow[];
    const sid = getSid(c);
    const myVote = db
      .prepare(`SELECT option_id FROM votes WHERE poll_id = ? AND session_id = ?`)
      .get(id, sid) as { option_id: string } | undefined;
    const closed = pollIsClosed(poll, Date.now());
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
        mySelectedOptionId: myVote?.option_id,
        closed,
      }),
    );
  });

  const adminQuery = z.object({ token: z.string().min(1) });

  r.get('/m/:id', (c) => {
    const id = c.req.param('id');
    const q = adminQuery.safeParse({ token: c.req.query('token') });
    if (!q.success) return c.text('Missing token', 401);
    const poll = db
      .prepare(`SELECT id, question, deadline_ms, admin_token, closed_at_ms FROM polls WHERE id = ?`)
      .get(id) as PollRow | undefined;
    if (!poll) return c.text('Not found', 404);
    if (poll.admin_token !== q.data.token) return c.text('Forbidden', 403);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as unknown as OptionRow[];
    const sid = getSid(c);
    const myVote = db
      .prepare(`SELECT option_id FROM votes WHERE poll_id = ? AND session_id = ?`)
      .get(id, sid) as { option_id: string } | undefined;
    const closed = pollIsClosed(poll, Date.now());
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
        adminToken: poll.admin_token,
        mySelectedOptionId: myVote?.option_id,
        closed,
      }),
    );
  });

  return r;
}
