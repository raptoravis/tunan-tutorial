import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.ts';
import { openDb, closeDb } from '../src/db.ts';

let app: ReturnType<typeof buildApp>;
let dbPath: string;
let tmp: string;

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'voting-test-'));
  dbPath = join(tmp, 'voting.sqlite');
  openDb(dbPath);
  app = buildApp();
});

after(() => {
  closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

async function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('U-1 POST /api/rooms 合法输入 → 200 + 返回 schema', async () => {
  const res = await post('/api/rooms', {
    title: '周五午餐吃啥',
    options: ['麻辣烫', '日料', '沙县'],
    allow_add: false,
  });
  assert.equal(res.status, 200);
  const json = (await res.json()) as { room_id: string; admin_token: string };
  assert.match(json.room_id, /^[0-9A-Za-z]{8}$/);
  assert.match(json.admin_token, /^[0-9a-f]{64}$/);
});

test('U-2 POST /api/rooms 标题空 → 400', async () => {
  const res = await post('/api/rooms', {
    title: '',
    options: ['a', 'b'],
    allow_add: false,
  });
  assert.equal(res.status, 400);
});

test('U-3 POST /api/rooms 候选项 < 2 → 400', async () => {
  const res = await post('/api/rooms', {
    title: 't',
    options: ['only'],
    allow_add: false,
  });
  assert.equal(res.status, 400);
});

test('U-4a POST /api/rooms 标题超长 (>120) → 400 字段 title', async () => {
  const res = await post('/api/rooms', {
    title: 'x'.repeat(121),
    options: ['a', 'b'],
    allow_add: false,
  });
  assert.equal(res.status, 400);
  const json = (await res.json()) as { error: string; field?: string };
  assert.equal(json.field, 'title');
});

test('U-4b POST /api/rooms 候选项超长 (>80) → 400 字段 options', async () => {
  const res = await post('/api/rooms', {
    title: 't',
    options: ['a', 'x'.repeat(81)],
    allow_add: false,
  });
  assert.equal(res.status, 400);
  const json = (await res.json()) as { error: string; field?: string };
  assert.equal(json.field, 'options');
});

test('U-5 POST + GET 往返一致，allow_add 字段保留', async () => {
  const res = await post('/api/rooms', {
    title: '团建去哪',
    options: ['西湖', '泰山'],
    allow_add: true,
  });
  const { room_id } = (await res.json()) as { room_id: string };
  const getRes = await app.request(`/api/rooms/${room_id}`);
  assert.equal(getRes.status, 200);
  const room = (await getRes.json()) as {
    id: string;
    title: string;
    allow_add: boolean;
    options: { id: number; label: string }[];
  };
  assert.equal(room.id, room_id);
  assert.equal(room.title, '团建去哪');
  assert.equal(room.allow_add, true);
  assert.equal(room.options.length, 2);
  assert.deepEqual(
    room.options.map((o) => o.label),
    ['西湖', '泰山'],
  );
  assert.ok(!('admin_token' in room));
  assert.ok(!('admin_hash' in room));
});

test('U-6 GET /api/rooms/不存在 → 404', async () => {
  const res = await app.request('/api/rooms/abcdefgh');
  assert.equal(res.status, 404);
});

test('U-7 持久化：close + reopen db 数据保留', async () => {
  const res = await post('/api/rooms', {
    title: 'persist-check',
    options: ['p', 'q'],
    allow_add: false,
  });
  const { room_id } = (await res.json()) as { room_id: string };

  closeDb();
  openDb(dbPath);

  const getRes = await app.request(`/api/rooms/${room_id}`);
  assert.equal(getRes.status, 200);
  const room = (await getRes.json()) as { title: string };
  assert.equal(room.title, 'persist-check');
});

test('Adv-D 重复候选项被去重或拒绝', async () => {
  const res = await post('/api/rooms', {
    title: 'dup',
    options: ['麻辣烫', '麻辣烫', '麻辣烫 '],
    allow_add: false,
  });
  if (res.status === 200) {
    const { room_id } = (await res.json()) as { room_id: string };
    const getRes = await app.request(`/api/rooms/${room_id}`);
    const room = (await getRes.json()) as { options: { label: string }[] };
    assert.equal(room.options.length, 1, '重复项应去重保留 1 个');
  } else {
    assert.equal(res.status, 400);
  }
});

test('Adv-E garbage body → 400 不崩溃', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'not-json-{{{',
  });
  assert.equal(res.status, 400);
});

test('Adv-G GET 房间 id 长度非法 → 404 或 400 不 500', async () => {
  const res = await app.request('/api/rooms/short');
  assert.ok(res.status === 404 || res.status === 400);
});
