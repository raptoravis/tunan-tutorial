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

async function createPoll(app: ReturnType<typeof createApp>, body: Record<string, unknown>) {
  const r = await app.request('/api/polls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { id: data.id as string };
}

async function getOptions(app: ReturnType<typeof createApp>, pollId: string) {
  const r = await app.request(`/api/polls/${pollId}`);
  const data = await r.json();
  return data.options as Array<{ id: string; label: string }>;
}

describe('POST /api/polls/:id/votes', () => {
  beforeEach(() => resetDb());

  it('T-V01 happy path: 200 + your_option_id reflects', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const opts = await getOptions(app, id);
    const res = await app.request(`/api/polls/${id}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ option_id: opts[0].id }),
    });
    expect(res.status).toBe(200);
    const voterCookie = (res.headers.get('set-cookie') ?? '').split(',').find((c) => c.includes('voter_id'))?.split(';')[0] ?? '';
    const view = await app.request(`/api/polls/${id}`, { headers: { cookie: voterCookie } });
    expect((await view.json()).your_option_id).toBe(opts[0].id);
  });

  it('T-V02 option_id not in this poll → 400', async () => {
    const app = createApp();
    const { id: p1 } = await createPoll(app, { title: 't1', options: ['a', 'b'] });
    const { id: p2 } = await createPoll(app, { title: 't2', options: ['c', 'd'] });
    const p2opts = await getOptions(app, p2);
    const res = await app.request(`/api/polls/${p1}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ option_id: p2opts[0].id }),
    });
    expect(res.status).toBe(400);
  });

  it('T-V03 poll not found → 404', async () => {
    const app = createApp();
    const res = await app.request('/api/polls/doesnotexi/votes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ option_id: 'whatever' }),
    });
    expect(res.status).toBe(404);
  });

  it('T-V04 deadline passed → 409', async () => {
    const app = createApp();
    const past = new Date(Date.now() - 1000).toISOString();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'], deadline_at: past });
    const opts = await getOptions(app, id);
    const res = await app.request(`/api/polls/${id}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ option_id: opts[0].id }),
    });
    expect(res.status).toBe(409);
  });

  it('T-V05 changing vote overwrites, not stacks', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b', 'c'] });
    const opts = await getOptions(app, id);

    const r1 = await app.request(`/api/polls/${id}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ option_id: opts[0].id }),
    });
    const voterCookie = (r1.headers.get('set-cookie') ?? '').split(',').find((c) => c.includes('voter_id'))?.split(';')[0] ?? '';

    const r2 = await app.request(`/api/polls/${id}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: voterCookie },
      body: JSON.stringify({ option_id: opts[1].id }),
    });
    expect(r2.status).toBe(200);

    const view = await app.request(`/api/polls/${id}`, { headers: { cookie: voterCookie } });
    expect((await view.json()).your_option_id).toBe(opts[1].id);
  });

  it('T-V06 GET your_option_id: cookie 缺失 → null', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const view = await app.request(`/api/polls/${id}`);
    expect((await view.json()).your_option_id).toBeNull();
  });

  it('T-V07 GET closed=true after deadline', async () => {
    const app = createApp();
    const past = new Date(Date.now() - 1000).toISOString();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'], deadline_at: past });
    const view = await app.request(`/api/polls/${id}`);
    const body = await view.json();
    expect(body.closed).toBe(true);
  });

  it('T-V08 missing option_id → 400', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const res = await app.request(`/api/polls/${id}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

async function castVote(app: ReturnType<typeof createApp>, pollId: string, optionId: string, cookie?: string) {
  return app.request(`/api/polls/${pollId}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ option_id: optionId }),
  });
}

function extractCookie(res: Response, name: string): string {
  const sc = res.headers.get('set-cookie') ?? '';
  return (
    sc
      .split(',')
      .find((c) => c.includes(`${name}=`))
      ?.split(';')[0] ?? ''
  );
}

describe('GET /api/polls/:id tallies', () => {
  beforeEach(() => resetDb());

  it('T-R01 no votes → tallies all zero', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const view = await app.request(`/api/polls/${id}`);
    const body = await view.json();
    expect(body.total_votes).toBe(0);
    expect(body.tallies.map((t: { count: number }) => t.count)).toEqual([0, 0]);
    expect(body.tallies.map((t: { percent: number }) => t.percent)).toEqual([0, 0]);
  });

  it('T-R02 2/1 distribution → 66.7 / 33.3', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const opts = await getOptions(app, id);

    const v1 = await castVote(app, id, opts[0].id);
    const v2 = await castVote(app, id, opts[0].id, extractCookie(v1, 'voter_id').replace(/voter_id=.+/, 'voter_id=v2'));
    const v3 = await castVote(app, id, opts[1].id, 'voter_id=v3');

    const view = await app.request(`/api/polls/${id}`);
    const body = await view.json();
    expect(body.total_votes).toBe(3);
    const ta = body.tallies.find((t: { option_id: string }) => t.option_id === opts[0].id);
    const tb = body.tallies.find((t: { option_id: string }) => t.option_id === opts[1].id);
    expect(ta.count).toBe(2);
    expect(tb.count).toBe(1);
    expect(ta.percent).toBeCloseTo(66.7, 0);
    expect(tb.percent).toBeCloseTo(33.3, 0);
  });

  it('T-R03 vote change subtracts old + adds new', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['a', 'b'] });
    const opts = await getOptions(app, id);

    const v1 = await castVote(app, id, opts[0].id);
    const cookie = extractCookie(v1, 'voter_id');
    await castVote(app, id, opts[1].id, cookie);

    const view = await app.request(`/api/polls/${id}`);
    const body = await view.json();
    expect(body.total_votes).toBe(1);
    const ta = body.tallies.find((t: { option_id: string }) => t.option_id === opts[0].id);
    const tb = body.tallies.find((t: { option_id: string }) => t.option_id === opts[1].id);
    expect(ta.count).toBe(0);
    expect(tb.count).toBe(1);
  });

  it('T-R04 tallies ordered by option position', async () => {
    const app = createApp();
    const { id } = await createPoll(app, { title: 't', options: ['x', 'y', 'z'] });
    const view = await app.request(`/api/polls/${id}`);
    const body = await view.json();
    expect(body.tallies.length).toBe(3);
    expect(body.options.map((o: { id: string }) => o.id)).toEqual(
      body.tallies.map((t: { option_id: string }) => t.option_id),
    );
  });
});
