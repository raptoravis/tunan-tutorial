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
  tmp = mkdtempSync(join(tmpdir(), 'voting-results-'));
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
  const j = (await res.json()) as { room_id: string };
  const getRes = await app.request(`/api/rooms/${j.room_id}`);
  const room = (await getRes.json()) as { options: { id: number; label: string }[] };
  return { room_id: j.room_id, options: room.options };
}

async function vote(roomId: string, optionIds: number[], pt: string) {
  return app.request(`/api/rooms/${roomId}/votes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `pt=${pt}` },
    body: JSON.stringify({ option_ids: optionIds }),
  });
}

async function results(roomId: string, withCookie = false) {
  return app.request(`/api/rooms/${roomId}/results`, {
    headers: withCookie ? { cookie: 'pt=' + '3'.repeat(64) } : {},
  });
}

type Results = {
  total_participants: number;
  options: { id: number; label: string; votes: number }[];
};

test('U-1 空房间结果 total=0 每项 votes=0', async () => {
  const { room_id, options } = await createRoom();
  const res = await results(room_id);
  assert.equal(res.status, 200);
  const r = (await res.json()) as Results;
  assert.equal(r.total_participants, 0);
  assert.equal(r.options.length, options.length);
  for (const o of r.options) assert.equal(o.votes, 0);
});

test('U-2 1 参与者投 1 项 → total=1，对应项 votes=1', async () => {
  const { room_id, options } = await createRoom();
  await vote(room_id, [options[0].id], '4'.repeat(64));
  const r = (await (await results(room_id)).json()) as Results;
  assert.equal(r.total_participants, 1);
  const a = r.options.find((o) => o.id === options[0].id)!;
  const b = r.options.find((o) => o.id === options[1].id)!;
  assert.equal(a.votes, 1);
  assert.equal(b.votes, 0);
});

test('U-3 1 参与者多选 → total=1，N 项各 votes=1', async () => {
  const { room_id, options } = await createRoom();
  await vote(room_id, [options[0].id, options[2].id], '5'.repeat(64));
  const r = (await (await results(room_id)).json()) as Results;
  assert.equal(r.total_participants, 1);
  assert.equal(r.options.find((o) => o.id === options[0].id)!.votes, 1);
  assert.equal(r.options.find((o) => o.id === options[1].id)!.votes, 0);
  assert.equal(r.options.find((o) => o.id === options[2].id)!.votes, 1);
});

test('U-4 2 参与者投同项 → total=2，该项 votes=2', async () => {
  const { room_id, options } = await createRoom();
  await vote(room_id, [options[0].id], '6'.repeat(64));
  await vote(room_id, [options[0].id], '7'.repeat(64));
  const r = (await (await results(room_id)).json()) as Results;
  assert.equal(r.total_participants, 2);
  assert.equal(r.options.find((o) => o.id === options[0].id)!.votes, 2);
});

test('U-5 已删除 option 不在结果列表', async () => {
  const { room_id, options } = await createRoom();
  getDb()
    .prepare('UPDATE options SET deleted_at = ? WHERE id = ?')
    .run(new Date().toISOString(), options[1].id);
  const r = (await (await results(room_id)).json()) as Results;
  assert.equal(r.options.length, options.length - 1);
  assert.ok(!r.options.some((o) => o.id === options[1].id));
});

test('U-6 房间已关闭仍可 GET results', async () => {
  const { room_id } = await createRoom();
  getDb().prepare('UPDATE rooms SET closed_at = ? WHERE id = ?').run(new Date().toISOString(), room_id);
  const res = await results(room_id);
  assert.equal(res.status, 200);
});

test('U-7 房间不存在 → 404', async () => {
  const res = await results('zzzzzzzz');
  assert.equal(res.status, 404);
});

test('U-8 不带 cookie 也可 GET (公开)', async () => {
  const { room_id } = await createRoom();
  const res = await results(room_id, false);
  assert.equal(res.status, 200);
});
