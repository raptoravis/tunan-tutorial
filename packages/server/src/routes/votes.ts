import { Hono } from 'hono';
import { getDb } from '../db.ts';
import { getOrIssuePt } from '../lib/participant.ts';

export const votes = new Hono();

const ROOM_ID_RE = /^[0-9A-Za-z]{8}$/;

type RoomRow = {
  id: string;
  closed_at: string | null;
};

function getRoom(id: string): RoomRow | undefined {
  return getDb()
    .prepare('SELECT id, closed_at FROM rooms WHERE id = ?')
    .get(id) as RoomRow | undefined;
}

votes.post('/api/rooms/:id/votes', async (c) => {
  const id = c.req.param('id');
  if (!ROOM_ID_RE.test(id)) return c.json({ error: 'room id 格式非法' }, 404);

  const room = getRoom(id);
  if (!room) return c.json({ error: '房间不存在' }, 404);
  if (room.closed_at) return c.json({ error: '投票已结束' }, 410);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: '请求体必须是合法 JSON' }, 400);
  }
  const optionIdsRaw = (body as { option_ids?: unknown }).option_ids;
  if (!Array.isArray(optionIdsRaw)) {
    return c.json({ error: 'option_ids 必须是数组' }, 400);
  }
  const optionIds: number[] = [];
  const seen = new Set<number>();
  for (const x of optionIdsRaw) {
    if (typeof x !== 'number' || !Number.isInteger(x) || x <= 0) {
      return c.json({ error: 'option_ids 元素必须是正整数' }, 400);
    }
    if (!seen.has(x)) {
      seen.add(x);
      optionIds.push(x);
    }
  }
  if (optionIds.length === 0) {
    return c.json({ error: '至少选 1 项' }, 400);
  }

  const db = getDb();
  const placeholders = optionIds.map(() => '?').join(',');
  const validOptions = db
    .prepare(
      `SELECT id FROM options WHERE room_id = ? AND deleted_at IS NULL AND id IN (${placeholders})`,
    )
    .all(id, ...optionIds) as { id: number }[];
  if (validOptions.length !== optionIds.length) {
    return c.json({ error: 'option_id 不属于本房间或已删除' }, 400);
  }

  const pt = getOrIssuePt(c);
  const now = new Date().toISOString();

  const txn = db.exec.bind(db);
  txn('BEGIN');
  try {
    db.prepare('DELETE FROM votes WHERE room_id = ? AND participant_token = ?').run(id, pt);
    const ins = db.prepare(
      'INSERT INTO votes (room_id, participant_token, option_id, created_at) VALUES (?, ?, ?, ?)',
    );
    for (const oid of optionIds) {
      ins.run(id, pt, oid, now);
    }
    txn('COMMIT');
  } catch (e) {
    txn('ROLLBACK');
    throw e;
  }

  return c.json({ ok: true, selected: optionIds });
});

votes.get('/api/rooms/:id/my-vote', (c) => {
  const id = c.req.param('id');
  if (!ROOM_ID_RE.test(id)) return c.json({ error: 'room id 格式非法' }, 404);
  const room = getRoom(id);
  if (!room) return c.json({ error: '房间不存在' }, 404);

  const pt = getOrIssuePt(c);
  const rows = getDb()
    .prepare('SELECT option_id FROM votes WHERE room_id = ? AND participant_token = ?')
    .all(id, pt) as { option_id: number }[];
  return c.json({ selected: rows.map((r) => r.option_id) });
});
