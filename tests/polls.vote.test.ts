import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, type DB } from '../src/db.js';
import { createApp } from '../src/app.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
function isoIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

async function createPoll(app: ReturnType<typeof createApp>) {
  const r = await app.request('/api/polls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      question: 'lunch',
      options: ['ramen', 'rice'],
      deadline: isoIn(ONE_HOUR_MS),
    }),
  });
  return r.json() as Promise<{ pollId: string; adminToken: string }>;
}

function extractCookie(res: Response): string | undefined {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return undefined;
  const m = setCookie.match(/vsid=([^;]+)/);
  return m ? `vsid=${m[1]}` : undefined;
}

describe('STORY-002 POST /api/polls/:id/vote', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  it('happy path writes one row', async () => {
    const { pollId } = await createPoll(app);
    const opt = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(pollId) as { id: string };
    const res = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id }),
    });
    expect(res.status).toBe(200);
    const count = db.prepare('SELECT COUNT(*) AS c FROM votes WHERE poll_id = ?').get(pollId) as { c: number };
    expect(count.c).toBe(1);
  });

  it('second vote from same session updates instead of insert', async () => {
    const { pollId } = await createPoll(app);
    const opts = db.prepare('SELECT id FROM options WHERE poll_id = ?').all(pollId) as Array<{ id: string }>;
    const r1 = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opts[0].id }),
    });
    const cookie = extractCookie(r1)!;
    expect(cookie).toBeDefined();
    await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ optionId: opts[1].id }),
    });
    const rows = db.prepare('SELECT option_id FROM votes WHERE poll_id = ?').all(pollId) as Array<{ option_id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].option_id).toBe(opts[1].id);
  });

  it('first request without cookie sets a session cookie', async () => {
    const { pollId } = await createPoll(app);
    const opt = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(pollId) as { id: string };
    const res = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id }),
    });
    expect(res.headers.get('set-cookie')).toMatch(/vsid=/);
    expect(res.headers.get('set-cookie')).toMatch(/HttpOnly/i);
  });

  it('unknown optionId → 404 option_not_found', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: 'nope' }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'option_not_found' });
  });

  it('optionId belongs to another poll → 404', async () => {
    const p1 = await createPoll(app);
    const p2 = await createPoll(app);
    const opt2 = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(p2.pollId) as { id: string };
    const res = await app.request(`/api/polls/${p1.pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt2.id }),
    });
    expect(res.status).toBe(404);
  });

  it('GET /v/:id with prior vote shows the selected option highlighted', async () => {
    const { pollId } = await createPoll(app);
    const opt = db.prepare('SELECT id FROM options WHERE poll_id = ? LIMIT 1').get(pollId) as { id: string };
    const r1 = await app.request(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: opt.id }),
    });
    const cookie = extractCookie(r1)!;
    const view = await app.request(`/v/${pollId}`, { headers: { cookie } });
    const html = await view.text();
    expect(html).toContain('已选');
    expect(html).toContain('aria-pressed="true"');
  });
});
