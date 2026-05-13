import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { resetDb } from '../src/db.js';

describe('POST /api/polls', () => {
  beforeEach(() => {
    resetDb();
  });

  it('T-001 happy path: returns 200 + id + sets owner_token cookie', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '中饭吃啥',
        options: ['麻辣烫', '沙县', '便当'],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBe(10);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/owner_token=/);
  });

  it('T-002a title empty → 400', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '', options: ['a', 'b'] }),
    });
    expect(res.status).toBe(400);
  });

  it('T-002b title 101 chars → 400', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'x'.repeat(101), options: ['a', 'b'] }),
    });
    expect(res.status).toBe(400);
  });

  it('T-003a options < 2 → 400', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['only'] }),
    });
    expect(res.status).toBe(400);
  });

  it('T-003b options > 10 → 400', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 't',
        options: Array.from({ length: 11 }, (_, i) => `o${i}`),
      }),
    });
    expect(res.status).toBe(400);
  });

  it('T-003c duplicate options → 400', async () => {
    const app = createApp();
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'a', 'b'] }),
    });
    expect(res.status).toBe(400);
  });

  it('T-007 deadline_at stored as ISO when provided; null otherwise', async () => {
    const app = createApp();
    const r1 = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'b'] }),
    });
    const { id: id1 } = await r1.json();
    const g1 = await app.request(`/api/polls/${id1}`);
    const p1 = await g1.json();
    expect(p1.deadline_at).toBeNull();

    const deadline = '2099-01-01T00:00:00.000Z';
    const r2 = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'b'], deadline_at: deadline }),
    });
    const { id: id2 } = await r2.json();
    const g2 = await app.request(`/api/polls/${id2}`);
    const p2 = await g2.json();
    expect(p2.deadline_at).toBe(deadline);
  });
});

describe('GET /api/polls/:id', () => {
  beforeEach(() => {
    resetDb();
  });

  it('T-004 returns options in position order', async () => {
    const app = createApp();
    const r = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['x', 'y', 'z'] }),
    });
    const { id } = await r.json();
    const g = await app.request(`/api/polls/${id}`);
    const poll = await g.json();
    expect(poll.options.map((o: { label: string }) => o.label)).toEqual(['x', 'y', 'z']);
  });

  it('T-005 not found → 404', async () => {
    const app = createApp();
    const g = await app.request('/api/polls/doesnotexi');
    expect(g.status).toBe(404);
  });

  it('T-006 is_owner reflects owner_token cookie', async () => {
    const app = createApp();
    const r = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 't', options: ['a', 'b'] }),
    });
    const setCookie = r.headers.get('set-cookie') ?? '';
    const ownerCookie = setCookie.split(';')[0];
    const { id } = await r.json();

    const ownerView = await app.request(`/api/polls/${id}`, {
      headers: { cookie: ownerCookie },
    });
    expect((await ownerView.json()).is_owner).toBe(true);

    const guestView = await app.request(`/api/polls/${id}`);
    expect((await guestView.json()).is_owner).toBe(false);
  });
});
