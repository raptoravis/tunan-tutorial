import { describe, it, expect } from 'vitest';
import { app } from '../src/index.js';
import { db } from '../src/db.js';

describe('GET /api/health', () => {
  it('returns { ok: true, db: "ok" }', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, db: 'ok' });
  });
});

describe('db singleton', () => {
  it('can run SELECT 1', () => {
    const row = db.prepare('SELECT 1 as one').get() as { one: number };
    expect(row.one).toBe(1);
  });
});
