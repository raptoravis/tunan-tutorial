import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, type DB } from '../src/db.js';
import { createApp } from '../src/app.js';

function isoIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

async function createPoll(
  app: ReturnType<typeof createApp>,
  opts: { publicDetails?: boolean; optionCount?: number } = {},
) {
  const optionCount = opts.optionCount ?? 2;
  const options = Array.from({ length: optionCount }, (_, i) => `opt-${i + 1}`);
  const r = await app.request('/api/polls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      question: 'q',
      options,
      deadline: isoIn(60 * 60 * 1000),
      publicDetails: opts.publicDetails ?? false,
    }),
  });
  return r.json() as Promise<{ pollId: string; adminToken: string }>;
}

describe('STORY-005 add option + public details', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  it('add option happy → 201 + db row', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: '杭州' }),
    });
    expect(res.status).toBe(201);
    const count = db.prepare('SELECT COUNT(*) AS c FROM options WHERE poll_id = ?').get(pollId) as { c: number };
    expect(count.c).toBe(3);
  });

  it('add option after close → 409 poll_closed', async () => {
    const { pollId, adminToken } = await createPoll(app);
    await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    const res = await app.request(`/api/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'late' }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'poll_closed' });
  });

  it('add option at limit (30) → 409 options_limit', async () => {
    const { pollId } = await createPoll(app, { optionCount: 10 });
    for (let i = 0; i < 20; i++) {
      const r = await app.request(`/api/polls/${pollId}/options`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: `extra-${i}` }),
      });
      expect(r.status).toBe(201);
    }
    const res = await app.request(`/api/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'over' }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'options_limit' });
  });

  it('add option invalid label (empty) → 400', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: '   ' }),
    });
    expect(res.status).toBe(400);
  });

  it('results.voters present iff publicDetails=true', async () => {
    const pub = await createPoll(app, { publicDetails: true });
    const priv = await createPoll(app, { publicDetails: false });
    const pubRes = (await (await app.request(`/api/polls/${pub.pollId}/results`)).json()) as { voters?: unknown };
    const privRes = (await (await app.request(`/api/polls/${priv.pollId}/results`)).json()) as { voters?: unknown };
    expect(pubRes.voters).toBeDefined();
    expect(privRes.voters).toBeUndefined();
  });

  it('voters list shows nicknames or anonymous fallback', async () => {
    const { pollId } = await createPoll(app, { publicDetails: true });
    const opt = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(pollId) as { id: string };
    // voter with nickname
    await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id, nickname: '小张' }),
    });
    // voter without nickname (new session = no cookie)
    await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id }),
    });
    const data = (await (await app.request(`/api/polls/${pollId}/results`)).json()) as {
      voters: Array<{ optionId: string; nickname: string }>;
    };
    expect(data.voters).toHaveLength(2);
    const names = data.voters.map((v) => v.nickname).sort();
    expect(names).toContain('小张');
    expect(names.some((n) => n.startsWith('匿名'))).toBe(true);
  });

  it('GET /v/:id renders add-option form when not closed', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/v/${pollId}`);
    const html = await res.text();
    expect(html).toContain('id="add-option-form"');
    expect(html).toContain('nickname-input');
  });

  it('GET /v/:id omits add-option form when closed', async () => {
    const { pollId, adminToken } = await createPoll(app);
    await app.request(`/api/polls/${pollId}/close?token=${adminToken}`, { method: 'POST' });
    const res = await app.request(`/v/${pollId}`);
    const html = await res.text();
    expect(html).not.toContain('id="add-option-form"');
  });

  it('mobile-first: layout has viewport meta and 44px-friendly buttons', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/v/${pollId}`);
    const html = await res.text();
    expect(html).toContain('width=device-width');
    expect(html).toMatch(/min-height:\s*44px/);
  });
});
