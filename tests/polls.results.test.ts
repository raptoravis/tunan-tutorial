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
      options: ['a', 'b', 'c'],
      deadline: isoIn(ONE_HOUR_MS),
    }),
  });
  return r.json() as Promise<{ pollId: string; adminToken: string }>;
}

function extractCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie')!;
  const m = setCookie.match(/vsid=([^;]+)/)!;
  return `vsid=${m[1]}`;
}

async function castVote(app: ReturnType<typeof createApp>, pollId: string, optionId: string, cookie?: string) {
  return app.request(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ optionId }),
  });
}

describe('STORY-003 GET /api/polls/:id/results', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  it('zero votes → totalVoters 0 and all options 0%', async () => {
    const { pollId } = await createPoll(app);
    const res = await app.request(`/api/polls/${pollId}/results`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      closed: boolean;
      totalVoters: number;
      options: Array<{ count: number; percent: number }>;
    };
    expect(data.closed).toBe(false);
    expect(data.totalVoters).toBe(0);
    for (const o of data.options) {
      expect(o.count).toBe(0);
      expect(o.percent).toBe(0);
    }
  });

  it('tallies counts and percentages correctly across distinct sessions', async () => {
    const { pollId } = await createPoll(app);
    const opts = db.prepare('SELECT id FROM options WHERE poll_id = ? ORDER BY created_at_ms').all(pollId) as Array<{ id: string }>;
    // 3 voters: 2 for opts[0], 1 for opts[1]
    const r1 = await castVote(app, pollId, opts[0].id);
    const r2 = await castVote(app, pollId, opts[0].id);
    const r3 = await castVote(app, pollId, opts[1].id);
    expect([r1, r2, r3].map((r) => r.status)).toEqual([200, 200, 200]);
    // Each request without cookie → new session
    const c1 = extractCookie(r1);
    const c2 = extractCookie(r2);
    const c3 = extractCookie(r3);
    expect(new Set([c1, c2, c3]).size).toBe(3);

    const res = await app.request(`/api/polls/${pollId}/results`);
    const data = (await res.json()) as {
      totalVoters: number;
      options: Array<{ id: string; count: number; percent: number }>;
    };
    expect(data.totalVoters).toBe(3);
    const map = Object.fromEntries(data.options.map((o) => [o.id, o]));
    expect(map[opts[0].id].count).toBe(2);
    expect(map[opts[0].id].percent).toBeCloseTo(66.7, 0);
    expect(map[opts[1].id].count).toBe(1);
    expect(map[opts[1].id].percent).toBeCloseTo(33.3, 0);
    expect(map[opts[2].id].count).toBe(0);
    expect(map[opts[2].id].percent).toBe(0);
  });

  it('changing vote does not double-count', async () => {
    const { pollId } = await createPoll(app);
    const opts = db.prepare('SELECT id FROM options WHERE poll_id = ? ORDER BY created_at_ms').all(pollId) as Array<{ id: string }>;
    const r1 = await castVote(app, pollId, opts[0].id);
    const cookie = extractCookie(r1);
    await castVote(app, pollId, opts[1].id, cookie);
    const res = await app.request(`/api/polls/${pollId}/results`);
    const data = (await res.json()) as { totalVoters: number; options: Array<{ id: string; count: number }> };
    expect(data.totalVoters).toBe(1);
    const map = Object.fromEntries(data.options.map((o) => [o.id, o]));
    expect(map[opts[0].id].count).toBe(0);
    expect(map[opts[1].id].count).toBe(1);
  });

  it('unknown poll → 404', async () => {
    const res = await app.request('/api/polls/nope/results');
    expect(res.status).toBe(404);
  });
});
