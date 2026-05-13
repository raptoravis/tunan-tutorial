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
  tmp = mkdtempSync(join(tmpdir(), 'voting-opts-'));
  openDb(join(tmp, 'voting.sqlite'));
  app = buildApp();
});
after(() => {
  closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

async function createRoom(allow_add: boolean) {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 't', options: ['A', 'B'], allow_add }),
  });
  const j = (await res.json()) as { room_id: string };
  return j.room_id;
}

async function addOption(roomId: string, label: unknown) {
  return app.request(`/api/rooms/${roomId}/options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ label }),
  });
}

test('U-1 allow_add=true POST → 200', async () => {
  const room = await createRoom(true);
  const res = await addOption(room, '新选项');
  assert.equal(res.status, 200);
  const j = (await res.json()) as { id: number; label: string };
  assert.equal(j.label, '新选项');
  assert.ok(Number.isInteger(j.id));
});

test('U-2 新追加项在 GET /api/rooms 中可见', async () => {
  const room = await createRoom(true);
  await addOption(room, 'X');
  const getRes = await app.request(`/api/rooms/${room}`);
  const r = (await getRes.json()) as { options: { label: string }[] };
  assert.ok(r.options.some((o) => o.label === 'X'));
});

test('U-3 新追加项可投票', async () => {
  const room = await createRoom(true);
  const addRes = await addOption(room, 'Y');
  const newId = ((await addRes.json()) as { id: number }).id;
  const voteRes = await app.request(`/api/rooms/${room}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'pt=' + '8'.repeat(64) },
    body: JSON.stringify({ option_ids: [newId] }),
  });
  assert.equal(voteRes.status, 200);
});

test('U-4 allow_add=false → 403', async () => {
  const room = await createRoom(false);
  const res = await addOption(room, 'nope');
  assert.equal(res.status, 403);
});

test('U-5 关闭房间 → 410', async () => {
  const room = await createRoom(true);
  getDb().prepare('UPDATE rooms SET closed_at = ? WHERE id = ?').run(new Date().toISOString(), room);
  const res = await addOption(room, 'late');
  assert.equal(res.status, 410);
});

test('U-6 房间不存在 → 404', async () => {
  const res = await addOption('zzzzzzzz', 'x');
  assert.equal(res.status, 404);
});

test('U-7 重复 label trim+case-insensitive → 409', async () => {
  const room = await createRoom(true);
  await addOption(room, '麻辣烫');
  const r1 = await addOption(room, '麻辣烫');
  assert.equal(r1.status, 409);
  const r2 = await addOption(room, ' 麻辣烫 ');
  assert.equal(r2.status, 409);
  // 初始 options A/B 也算
  const r3 = await addOption(room, 'a');
  assert.equal(r3.status, 409);
});

test('U-8 label 超长 → 400', async () => {
  const room = await createRoom(true);
  const res = await addOption(room, 'x'.repeat(81));
  assert.equal(res.status, 400);
});

test('U-9 空字符串 / 仅空白 → 400', async () => {
  const room = await createRoom(true);
  assert.equal((await addOption(room, '')).status, 400);
  assert.equal((await addOption(room, '   ')).status, 400);
});

test('U-10 label 不是字符串 → 400', async () => {
  const room = await createRoom(true);
  assert.equal((await addOption(room, 123)).status, 400);
  assert.equal((await addOption(room, null)).status, 400);
});

test('U-11 软删项同名追加 → 409 不复活', async () => {
  const room = await createRoom(true);
  const r = await addOption(room, 'Z');
  const newId = ((await r.json()) as { id: number }).id;
  getDb().prepare('UPDATE options SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), newId);
  const r2 = await addOption(room, 'Z');
  assert.equal(r2.status, 409);
});
