import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { app } from '../src/index.js';
import { db, ensureSchema } from '../src/db.js';

beforeAll(() => {
  ensureSchema();
});

beforeEach(() => {
  db.exec('DELETE FROM vote_sessions; DELETE FROM vote_options; DELETE FROM votes;');
});

async function createVote(): Promise<string> {
  const res = await app.request('/api/votes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'lunch', options: ['A', 'B', 'C'] }),
  });
  const { id } = (await res.json()) as { id: string };
  return id;
}

describe('GET /api/votes/:id', () => {
  it('F-1+F-2 returns shape with sorted options and zero counts', async () => {
    const id = await createVote();
    const res = await app.request(`/api/votes/${id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      title: string;
      options: { idx: number; label: string; count: number }[];
      closed: boolean;
      you_voted_idx: number | null;
    };
    expect(body.id).toBe(id);
    expect(body.title).toBe('lunch');
    expect(body.options.map((o) => o.idx)).toEqual([0, 1, 2]);
    expect(body.options.map((o) => o.label)).toEqual(['A', 'B', 'C']);
    expect(body.options.every((o) => o.count === 0)).toBe(true);
    expect(body.closed).toBe(false);
    expect(body.you_voted_idx).toBeNull();
  });

  it('F-3 returns 404 for unknown id', async () => {
    const res = await app.request('/api/votes/ZZZZZZZZ');
    expect(res.status).toBe(404);
  });

  it('F-4 sets vsession cookie on first visit', async () => {
    const id = await createVote();
    const res = await app.request(`/api/votes/${id}`);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/vsession=[a-f0-9]{32}/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
  });

  it('F-5 reflects you_voted_idx when session has voted', async () => {
    const id = await createVote();
    const sessionToken = 'a'.repeat(32);
    db.prepare(
      'INSERT INTO vote_sessions (vote_id, session_token, option_idx) VALUES (?, ?, ?)',
    ).run(id, sessionToken, 1);
    const res = await app.request(`/api/votes/${id}`, {
      headers: { cookie: `vsession=${sessionToken}` },
    });
    const body = (await res.json()) as { you_voted_idx: number | null; options: { count: number }[] };
    expect(body.you_voted_idx).toBe(1);
    expect(body.options[1].count).toBe(1);
  });
});
