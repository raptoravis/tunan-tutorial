import { Hono } from 'hono';
import { z } from 'zod';
import type { DB } from '../db.js';
import { newPollId, newOptionId, newAdminToken } from '../ids.js';
import { createPollSchema, validateDeadlineMs } from '../validation.js';
import { renderCreatePage } from '../views/create.js';
import { renderPollPage } from '../views/poll.js';

export function pollsRoutes(db: DB) {
  const r = new Hono();

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

  const adminQuery = z.object({ token: z.string().min(1) });

  r.get('/v/:id', (c) => {
    const id = c.req.param('id');
    const poll = db
      .prepare(`SELECT id, question, deadline_ms FROM polls WHERE id = ?`)
      .get(id) as { id: string; question: string; deadline_ms: number } | undefined;
    if (!poll) return c.text('Not found', 404);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as Array<{ id: string; label: string }>;
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
      }),
    );
  });

  r.get('/m/:id', (c) => {
    const id = c.req.param('id');
    const q = adminQuery.safeParse({ token: c.req.query('token') });
    if (!q.success) return c.text('Missing token', 401);
    const poll = db
      .prepare(`SELECT id, question, deadline_ms, admin_token FROM polls WHERE id = ?`)
      .get(id) as { id: string; question: string; deadline_ms: number; admin_token: string } | undefined;
    if (!poll) return c.text('Not found', 404);
    if (poll.admin_token !== q.data.token) return c.text('Forbidden', 403);
    const options = db
      .prepare(`SELECT id, label FROM options WHERE poll_id = ? ORDER BY created_at_ms`)
      .all(id) as Array<{ id: string; label: string }>;
    return c.html(
      renderPollPage({
        id: poll.id,
        question: poll.question,
        deadlineMs: poll.deadline_ms,
        options,
        adminToken: poll.admin_token,
      }),
    );
  });

  return r;
}
