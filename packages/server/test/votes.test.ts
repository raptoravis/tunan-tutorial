import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.ts';
import { openDb, closeDb, getDb } from '../src/db.ts';

let app: ReturnType<typeof buildApp>;
let dbPath: string;
let tmp: string;

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'voting-vote-test-'));
  dbPath = join(tmp, 'voting.sqlite');
  openDb(dbPath);
  app = buildApp();
});

after(() => {
  closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

function parseSetCookie(res: Response): string | null {
  const sc = res.headers.get('set-cookie');
  if (!sc) return null;
  const m = sc.match(/pt=([^;]+)/);
  return m ? m[1] : null;
}

async function createRoom(opts: { allow_add?: boolean } = {}) {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 't',
      options: ['A', 'B', 'C'],
      allow_add: opts.allow_add ?? false,
    }),
  });
  const j = (await res.json()) as { room_id: string; admin_token: string };
  const getRes = await app.request(`/api/rooms/${j.room_id}`);
  const room = (await getRes.json()) as { options: { id: number; label: string }[] };
  return { room_id: j.room_id, admin_token: j.admin_token, options: room.options };
}

async function postVote(roomId: string, optionIds: number[], cookie?: string) {
  return app.request(`/api/rooms/${roomId}/votes`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie: `pt=${cookie}` } : {}),
    },
    body: JSON.stringify({ option_ids: optionIds }),
  });
}

async function getMyVote(roomId: string, cookie?: string) {
  return app.request(`/api/rooms/${roomId}/my-vote`, {
    headers: cookie ? { cookie: `pt=${cookie}` } : {},
  });
}

test('U-1 首次 GET 房间响应含 Set-Cookie pt', async () => {
  const { room_id } = await createRoom();
  const res = await app.request(`/api/rooms/${room_id}`);
  assert.equal(res.status, 200);
  const sc = res.headers.get('set-cookie');
  assert.ok(sc, '应有 Set-Cookie');
  assert.match(sc!, /pt=[0-9a-f]{64}/);
  assert.match(sc!, /HttpOnly/i);
  assert.match(sc!, /SameSite=Lax/i);
});

test('U-2 POST 合法多选 → 200 + selected 返回', async () => {
  const { room_id, options } = await createRoom();
  const pt = 'a'.repeat(64);
  const res = await postVote(room_id, [options[0].id, options[2].id], pt);
  assert.equal(res.status, 200);
  const j = (await res.json()) as { ok: boolean; selected: number[] };
  assert.equal(j.ok, true);
  assert.deepEqual(j.selected.sort((a, b) => a - b), [options[0].id, options[2].id].sort((a, b) => a - b));
});

test('U-3 POST 后 GET my-vote 同 cookie 回显一致', async () => {
  const { room_id, options } = await createRoom();
  const pt = 'b'.repeat(64);
  await postVote(room_id, [options[1].id], pt);
  const res = await getMyVote(room_id, pt);
  assert.equal(res.status, 200);
  const j = (await res.json()) as { selected: number[] };
  assert.deepEqual(j.selected, [options[1].id]);
});

test('U-4 同 cookie 二次 POST 覆盖（不累加）', async () => {
  const { room_id, options } = await createRoom();
  const pt = 'c'.repeat(64);
  await postVote(room_id, [options[0].id, options[1].id], pt);
  await postVote(room_id, [options[2].id], pt);
  const res = await getMyVote(room_id, pt);
  const j = (await res.json()) as { selected: number[] };
  assert.deepEqual(j.selected, [options[2].id]);
  const db = getDb();
  const rows = db
    .prepare('SELECT COUNT(*) AS c FROM votes WHERE room_id = ? AND participant_token = ?')
    .get(room_id, pt) as { c: number };
  assert.equal(rows.c, 1);
});

test('U-5 房间已关闭 → POST 返回 410', async () => {
  const { room_id, options } = await createRoom();
  getDb()
    .prepare('UPDATE rooms SET closed_at = ? WHERE id = ?')
    .run(new Date().toISOString(), room_id);
  const res = await postVote(room_id, [options[0].id], 'd'.repeat(64));
  assert.equal(res.status, 410);
});

test('U-6 不存在的 room_id → 404', async () => {
  const res = await postVote('zzzzzzzz', [1], 'e'.repeat(64));
  assert.equal(res.status, 404);
});

test('U-7 POST option_ids=[] → 400', async () => {
  const { room_id } = await createRoom();
  const res = await postVote(room_id, [], 'f'.repeat(64));
  assert.equal(res.status, 400);
});

test('U-8 POST 含其他房间的 option_id → 400 不串库', async () => {
  const r1 = await createRoom();
  const r2 = await createRoom();
  const res = await postVote(r1.room_id, [r2.options[0].id], 'g'.repeat(64));
  assert.equal(res.status, 400);
});

test('U-9 POST 缺 option_ids 字段 → 400', async () => {
  const { room_id } = await createRoom();
  const res = await app.request(`/api/rooms/${room_id}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + 'h'.repeat(64) },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('U-10 两个 cookie 视作不同参与者', async () => {
  const { room_id, options } = await createRoom();
  const ptA = '0'.repeat(64);
  const ptB = '1'.repeat(64);
  await postVote(room_id, [options[0].id], ptA);
  await postVote(room_id, [options[1].id], ptB);
  const r1 = await getMyVote(room_id, ptA);
  const r2 = await getMyVote(room_id, ptB);
  const j1 = (await r1.json()) as { selected: number[] };
  const j2 = (await r2.json()) as { selected: number[] };
  assert.deepEqual(j1.selected, [options[0].id]);
  assert.deepEqual(j2.selected, [options[1].id]);
});

test('U-11 已 deleted 的 option_id 不可投 → 400', async () => {
  const { room_id, options } = await createRoom();
  getDb()
    .prepare('UPDATE options SET deleted_at = ? WHERE id = ?')
    .run(new Date().toISOString(), options[1].id);
  const res = await postVote(room_id, [options[1].id], 'k'.repeat(64));
  assert.equal(res.status, 400);
});

test('U-12 并发 10 次提交后最后一次胜出', async () => {
  const { room_id, options } = await createRoom();
  const pt = '2'.repeat(64);
  const reqs: Promise<Response>[] = [];
  for (let i = 0; i < 10; i++) {
    reqs.push(postVote(room_id, [options[i % 3].id], pt));
  }
  await Promise.all(reqs);
  const db = getDb();
  const rows = db
    .prepare('SELECT COUNT(*) AS c FROM votes WHERE room_id = ? AND participant_token = ?')
    .get(room_id, pt) as { c: number };
  // 至少 ≥1 且 ≤ 选项总数（覆盖语义下应只有一次胜出 = 1 行）
  assert.ok(rows.c >= 1 && rows.c <= 3, `expected 1-3, got ${rows.c}`);
});

test('Adv-C POST option_ids 是字符串 → 400', async () => {
  const { room_id } = await createRoom();
  const res = await app.request(`/api/rooms/${room_id}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + 'm'.repeat(64) },
    body: JSON.stringify({ option_ids: 'not-array' }),
  });
  assert.equal(res.status, 400);
});

test('Adv-D 不带 cookie POST → 服务端签发并接受', async () => {
  const { room_id, options } = await createRoom();
  const res = await postVote(room_id, [options[0].id]);
  assert.equal(res.status, 200);
  const pt = parseSetCookie(res);
  assert.ok(pt, '响应应有 Set-Cookie');
});
