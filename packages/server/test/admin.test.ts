import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.ts';
import { openDb, closeDb, getDb } from '../src/db.ts';

let app: ReturnType<typeof buildApp>;
let tmp: string;

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'voting-admin-'));
  openDb(join(tmp, 'voting.sqlite'));
  app = buildApp();
});
after(() => {
  closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

async function createRoom() {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 't', options: ['A', 'B', 'C'], allow_add: false }),
  });
  const j = (await res.json()) as { room_id: string; admin_token: string };
  const getRes = await app.request(`/api/rooms/${j.room_id}`);
  const r = (await getRes.json()) as { options: { id: number }[] };
  return { room_id: j.room_id, admin_token: j.admin_token, options: r.options };
}

async function closeRoom(roomId: string, token?: string) {
  return app.request(`/api/rooms/${roomId}/close`, {
    method: 'POST',
    headers: token ? { 'x-admin-token': token } : {},
  });
}

async function delOption(roomId: string, optionId: number, token?: string) {
  return app.request(`/api/rooms/${roomId}/options/${optionId}`, {
    method: 'DELETE',
    headers: token ? { 'x-admin-token': token } : {},
  });
}

test('U-1 正确 token 关闭房间 → 200 + closed_at', async () => {
  const { room_id, admin_token } = await createRoom();
  const res = await closeRoom(room_id, admin_token);
  assert.equal(res.status, 200);
  const j = (await res.json()) as { closed_at: string };
  assert.ok(j.closed_at);
});

test('U-2 错 token → 403', async () => {
  const { room_id } = await createRoom();
  const res = await closeRoom(room_id, 'wrong-token');
  assert.equal(res.status, 403);
});

test('U-3 缺 X-Admin-Token → 403', async () => {
  const { room_id } = await createRoom();
  const res = await closeRoom(room_id);
  assert.equal(res.status, 403);
});

test('U-4 关闭后投票 → 410', async () => {
  const { room_id, admin_token, options } = await createRoom();
  await closeRoom(room_id, admin_token);
  const v = await app.request(`/api/rooms/${room_id}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + '9'.repeat(64) },
    body: JSON.stringify({ option_ids: [options[0].id] }),
  });
  assert.equal(v.status, 410);
});

test('U-5 关闭幂等', async () => {
  const { room_id, admin_token } = await createRoom();
  const r1 = await closeRoom(room_id, admin_token);
  const j1 = (await r1.json()) as { closed_at: string };
  const r2 = await closeRoom(room_id, admin_token);
  assert.equal(r2.status, 200);
  const j2 = (await r2.json()) as { closed_at: string };
  assert.equal(j2.closed_at, j1.closed_at);
});

test('U-6 正确 token 删除候选项', async () => {
  const { room_id, admin_token, options } = await createRoom();
  const target = options[1].id;
  const res = await delOption(room_id, target, admin_token);
  assert.equal(res.status, 200);
  const getRes = await app.request(`/api/rooms/${room_id}`);
  const r = (await getRes.json()) as { options: { id: number }[] };
  assert.ok(!r.options.some((o) => o.id === target));
});

test('U-7 删除后该项的 votes 在 DB 中消失', async () => {
  const { room_id, admin_token, options } = await createRoom();
  const target = options[0].id;
  await app.request(`/api/rooms/${room_id}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + 'a'.repeat(64) },
    body: JSON.stringify({ option_ids: [target] }),
  });
  await delOption(room_id, target, admin_token);
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM votes WHERE option_id = ?')
    .get(target) as { c: number };
  assert.equal(row.c, 0);
});

test('U-8 错 token 删除 → 403', async () => {
  const { room_id, options } = await createRoom();
  const res = await delOption(room_id, options[0].id, 'wrong');
  assert.equal(res.status, 403);
});

test('U-9 删除不属于本房间的 option → 404', async () => {
  const { admin_token } = await createRoom();
  const other = await createRoom();
  const res = await delOption(other.room_id, other.options[0].id, admin_token);
  // 用了 A 房间的 token 操作 B 房间的 option → token 不匹配 B 房间 → 403
  // 但根据 PLAN: verify 先于 option 查找，所以是 403
  assert.equal(res.status, 403);
  // 真正"不属于本房间"语义测试：拿 B 的 token，但 optionId 来自 A
  const a = await createRoom();
  const wrongOpt = await delOption(other.room_id, a.options[0].id, other.admin_token);
  assert.equal(wrongOpt.status, 404);
});

test('U-10 删除已删除的 option → 404', async () => {
  const { room_id, admin_token, options } = await createRoom();
  await delOption(room_id, options[0].id, admin_token);
  const res = await delOption(room_id, options[0].id, admin_token);
  assert.equal(res.status, 404);
});

test('U-11 results 端点关闭后可读且反映删除后状态', async () => {
  const { room_id, admin_token, options } = await createRoom();
  await app.request(`/api/rooms/${room_id}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + 'b'.repeat(64) },
    body: JSON.stringify({ option_ids: [options[0].id, options[1].id] }),
  });
  await delOption(room_id, options[0].id, admin_token);
  await closeRoom(room_id, admin_token);
  const res = await app.request(`/api/rooms/${room_id}/results`);
  assert.equal(res.status, 200);
  const r = (await res.json()) as { options: { id: number; votes: number }[] };
  assert.ok(!r.options.some((o) => o.id === options[0].id));
  assert.equal(r.options.find((o) => o.id === options[1].id)!.votes, 1);
});
