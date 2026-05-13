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
