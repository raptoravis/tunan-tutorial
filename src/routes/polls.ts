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

const addOptionSchema = z.object({
  label: z.string().trim().min(1).max(100),
});

const MAX_OPTIONS_PER_POLL = 30;

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

  r.post('/api/polls/:id/options', async (c) => {
    const pollId = c.req.param('id');
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    const parsed = addOptionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

    const poll = db
      .prepare(`SELECT id, deadline_ms, closed_at_ms FROM polls WHERE id = ?`)
      .get(pollId) as { id: string; deadline_ms: number; closed_at_ms: number | null } | undefined;
    if (!poll) return c.json({ error: 'poll_not_found' }, 404);
    if (pollIsClosed(poll, Date.now())) return c.json({ error: 'poll_closed' }, 409);

    const count = db.prepare(`SELECT COUNT(*) AS c FROM options WHERE poll_id = ?`).get(pollId) as { c: number };
    if (Number(count.c) >= MAX_OPTIONS_PER_POLL) return c.json({ error: 'options_limit' }, 409);

    const id = newOptionId();
    const now = Date.now();
    db.prepare(`INSERT INTO options (id, poll_id, label, created_at_ms) VALUES (?, ?, ?, ?)`).run(id, pollId, parsed.data.label, now);
    return c.json({ id, label: parsed.data.label }, 201);
  });

  r.get('/api/polls/:id/results', (c) => {
    const id = c.req.param('id');
    const poll = db
      .prepare(`SELECT id, deadline_ms, closed_at_ms, public_details FROM polls WHERE id = ?`)
      .get(id) as { id: string; deadline_ms: number; closed_at_ms: number | null; public_details: number } | undefined;
    if (!poll) return c.json({ error: 'poll_not_found' }, 404);

    const rows = db
      .prepare(
        `SELECT o.id AS id, o.label AS label,
                (SELECT COUNT(*) FROM votes v WHERE v.option_id = o.id) AS count
         FROM options o WHERE o.poll_id = ? ORDER BY o.created_at_ms`,
      )
      .all(id) as unknown as Array<{ id: string; label: string; count: number }>;

    const totalVoters = rows.reduce((s, r) => s + Number(r.count), 0);
    const options = rows.map((r) => ({
      id: r.id,
      label: r.label,
      count: Number(r.count),
      percent: totalVoters === 0 ? 0 : Math.round((Number(r.count) / totalVoters) * 1000) / 10,
    }));

    const base: {
      closed: boolean;
      totalVoters: number;
      options: typeof options;
      voters?: Array<{ optionId: string; nickname: string }>;
    } = {
      closed: pollIsClosed(poll, Date.now()),
      totalVoters,
      options,
    };

    if (poll.public_details) {
      const voteRows = db
        .prepare(`SELECT option_id, nickname FROM votes WHERE poll_id = ? ORDER BY voted_at_ms`)
        .all(id) as unknown as Array<{ option_id: string; nickname: string | null }>;
      let anon = 0;
      base.voters = voteRows.map((v) => ({
        optionId: v.option_id,
        nickname: v.nickname && v.nickname.trim() !== '' ? v.nickname : `匿名 #${++anon}`,
      }));
    }

    return c.json(base);
  });

  r.post('/api/polls/:id/close', (c) => {
    const id = c.req.param('id');
    const token = c.req.query('token');
    if (!token) return c.json({ error: 'missing_token' }, 401);
    const poll = db
      .prepare(`SELECT id, admin_token, closed_at_ms FROM polls WHERE id = ?`)
      .get(id) as { id: string; admin_token: string; closed_at_ms: number | null } | undefined;
    if (!poll) return c.json({ error: 'poll_not_found' }, 404);
    if (poll.admin_token !== token) return c.json({ error: 'forbidden' }, 401);
    if (poll.closed_at_ms !== null) return c.json({ closed_at_ms: poll.closed_at_ms });
    const now = Date.now();
    db.prepare(`UPDATE polls SET closed_at_ms = ? WHERE id = ?`).run(now, id);
    return c.json({ closed_at_ms: now });
  });

  r.get('/v/:id', (c) => {
    const id = c.req.param('id');
    const poll = db
      .prepare(`SELECT id, question, deadline_ms, closed_at_ms, public_details FROM polls WHERE id = ?`)
      .get(id) as { id: string; question: string; deadline_ms: number; closed_at_ms: number | null; public_details: number } | undefined;
    if (!poll) return c.text('Not found', 404);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as unknown as OptionRow[];
    const sid = getSid(c);
    const myVote = db
      .prepare(`SELECT option_id, nickname FROM votes WHERE poll_id = ? AND session_id = ?`)
      .get(id, sid) as { option_id: string; nickname: string | null } | undefined;
    const closed = pollIsClosed(poll, Date.now());
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
        mySelectedOptionId: myVote?.option_id,
        myNickname: myVote?.nickname ?? undefined,
        publicDetails: !!poll.public_details,
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
      .prepare(`SELECT id, question, deadline_ms, admin_token, closed_at_ms, public_details FROM polls WHERE id = ?`)
      .get(id) as (PollRow & { public_details: number }) | undefined;
    if (!poll) return c.text('Not found', 404);
    if (poll.admin_token !== q.data.token) return c.text('Forbidden', 403);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as unknown as OptionRow[];
    const sid = getSid(c);
    const myVote = db
      .prepare(`SELECT option_id, nickname FROM votes WHERE poll_id = ? AND session_id = ?`)
      .get(id, sid) as { option_id: string; nickname: string | null } | undefined;
    const closed = pollIsClosed(poll, Date.now());
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
        adminToken: poll.admin_token,
        mySelectedOptionId: myVote?.option_id,
        myNickname: myVote?.nickname ?? undefined,
        publicDetails: !!poll.public_details,
        closed,
      }),
    );
  });

  return r;
}
