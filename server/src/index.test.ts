import { describe, it, expect, beforeEach } from 'vitest';
import { app } from './index.js';
import { db } from './db.js';
import { initSchema } from './schema.js';

beforeEach(() => {
  db.exec('DROP TABLE IF EXISTS votes; DROP TABLE IF EXISTS options; DROP TABLE IF EXISTS polls;');
  initSchema(db);
});

describe('GET /api/health', () => {
  it('returns 200 + {ok:true}', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('POST /api/polls', () => {
  it('creates poll and returns id + url', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'b'] }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; url: string };
    expect(body.id).toMatch(/^[0-9A-Za-z]{8}$/);
    expect(body.url).toBe(`/poll/${body.id}`);
  });

  it('returns 400 on invalid input', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '', options: ['a'] }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/polls/:id', () => {
  it('returns 200 + detail when exists', async () => {
    const createRes = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'b'] }),
    });
    const { id } = (await createRes.json()) as { id: string };
    const res = await app.request(`/api/polls/${id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; title: string; options: unknown[]; totalVotes: number };
    expect(body.id).toBe(id);
    expect(body.title).toBe('t');
    expect(body.options.length).toBe(2);
    expect(body.totalVotes).toBe(0);
  });

  it('returns 404 for unknown id', async () => {
    const res = await app.request('/api/polls/zzzzzzzz');
    expect(res.status).toBe(404);
  });
});
