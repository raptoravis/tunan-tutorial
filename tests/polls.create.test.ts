import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, type DB } from '../src/db.js';
import { createApp } from '../src/app.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
function isoIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

describe('STORY-001 POST /api/polls', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  it('happy path → 201 + 4 fields', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: '中午吃啥',
        options: ['拉面', '盖饭'],
        deadline: isoIn(ONE_HOUR_MS),
        publicDetails: false,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      pollId: expect.any(String),
      adminToken: expect.any(String),
      voteUrl: expect.stringContaining('/v/'),
      adminUrl: expect.stringContaining('/m/'),
    });
  });

  it('pollId is 22 chars, adminToken is 32 chars', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Q',
        options: ['a', 'b'],
        deadline: isoIn(ONE_HOUR_MS),
      }),
    });
    const body = await res.json();
    expect(body.pollId).toHaveLength(22);
    expect(body.adminToken).toHaveLength(32);
  });

  it('writes 1 row in polls and N rows in options', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Q',
        options: ['a', 'b', 'c'],
        deadline: isoIn(ONE_HOUR_MS),
      }),
    });
    const body = await res.json();
    const polls = db.prepare('SELECT COUNT(*) as c FROM polls WHERE id = ?').get(body.pollId) as { c: number };
    const options = db.prepare('SELECT COUNT(*) as c FROM options WHERE poll_id = ?').get(body.pollId) as { c: number };
    expect(polls.c).toBe(1);
    expect(options.c).toBe(3);
  });

  it('rejects empty question with 400', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: '',
        options: ['a', 'b'],
        deadline: isoIn(ONE_HOUR_MS),
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects single option with 400', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Q',
        options: ['only-one'],
        deadline: isoIn(ONE_HOUR_MS),
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects deadline too soon with 400 (deadline_too_soon)', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Q',
        options: ['a', 'b'],
        deadline: isoIn(5 * 60 * 1000),
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('deadline_too_soon');
  });

  it('rejects deadline too far with 400 (deadline_too_far)', async () => {
    const res = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Q',
        options: ['a', 'b'],
        deadline: isoIn(31 * 24 * 60 * 60 * 1000),
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('deadline_too_far');
  });

  it('GET /v/:id renders question and option labels', async () => {
    const created = await app.request('/api/polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: '周末去哪玩',
        options: ['杭州', '苏州'],
        deadline: isoIn(ONE_HOUR_MS),
      }),
    });
    const { pollId } = await created.json();
    const view = await app.request(`/v/${pollId}`);
    expect(view.status).toBe(200);
    const html = await view.text();
    expect(html).toContain('周末去哪玩');
    expect(html).toContain('杭州');
    expect(html).toContain('苏州');
  });

  it('GET / renders the create form', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<form');
    expect(html).toContain('name="question"');
  });
});
