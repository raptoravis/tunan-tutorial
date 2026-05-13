import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, type DB } from '../src/db.js';
import { createApp } from '../src/app.js';

function isoIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

async function createPoll(app: ReturnType<typeof createApp>) {
  const r = await app.request('/api/polls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      question: 'q',
      options: ['a', 'b'],
      deadline: isoIn(60 * 60 * 1000),
    }),
  });
  return r.json() as Promise<{ pollId: string; adminToken: string }>;
}

describe('STORY-004 POST /api/polls/:id/close', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  it('with valid admin token → 200 and closed_at_ms set', async () => {
    const { pollId, adminToken } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { closed_at_ms: number };
    expect(typeof data.closed_at_ms).toBe('number');
    const row = db.prepare('SELECT closed_at_ms FROM polls WHERE id = ?').get(pollId) as { closed_at_ms: number | null };
    expect(row.closed_at_ms).toBeTruthy();
  });

  it('without token → 401', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/close`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('with wrong token → 401', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/close?token=bogus`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('vote after close → 409 poll_closed', async () => {
    const { pollId, adminToken } = await createPoll(app);
    await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    const opt = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(pollId) as { id: string };
    const res = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'poll_closed' });
  });

  it('GET /v/:id after close → page shows closed banner and no submit button', async () => {
    const { pollId, adminToken } = await createPoll(app);
    await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    const res = await app.request(`/v/${pollId}`);
    const html = await res.text();
    expect(html).toContain('投票已结束');
    expect(html).not.toContain('class="option-btn');
  });

  it('results.closed = true after close', async () => {
    const { pollId, adminToken } = await createPoll(app);
    await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    const res = await app.request(`/api/polls/${pollId}/results`);
    const data = (await res.json()) as { closed: boolean };
    expect(data.closed).toBe(true);
  });
});
