import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index.js';
import { db, ensureSchema } from '../src/db.js';

beforeAll(() => {
  ensureSchema();
  db.exec('DELETE FROM vote_options; DELETE FROM votes;');
});

async function create(body: unknown) {
  return app.request('/api/votes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/votes', () => {
  it('F-1 creates a vote and returns id + admin_token', async () => {
    const res = await create({ title: '午饭', options: ['A', 'B'] });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { id: string; admin_token: string };
    expect(json.id).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(json.admin_token.length).toBeGreaterThanOrEqual(32);

    const voteRow = db.prepare('SELECT title FROM votes WHERE id = ?').get(json.id) as
      | { title: string }
      | undefined;
    expect(voteRow?.title).toBe('午饭');
    const opts = db
      .prepare('SELECT label FROM vote_options WHERE vote_id = ? ORDER BY idx')
      .all(json.id) as { label: string }[];
    expect(opts.map((r) => r.label)).toEqual(['A', 'B']);
  });

  it('F-3 rejects empty title', async () => {
    const res = await create({ title: '', options: ['A', 'B'] });
    expect(res.status).toBe(400);
  });

  it('F-4 rejects fewer than 2 options', async () => {
    const res = await create({ title: 'x', options: ['only'] });
    expect(res.status).toBe(400);
  });

  it('F-5 rejects more than 10 options', async () => {
    const res = await create({
      title: 'x',
      options: Array.from({ length: 11 }, (_, i) => `opt${i}`),
    });
    expect(res.status).toBe(400);
  });

  it('F-6 returns distinct ids for two creates', async () => {
    const a = (await (await create({ title: 'a', options: ['1', '2'] })).json()) as {
      id: string;
    };
    const b = (await (await create({ title: 'b', options: ['1', '2'] })).json()) as {
      id: string;
    };
    expect(a.id).not.toBe(b.id);
  });
});
