import { Hono } from 'hono';
import { getDb } from '../db.ts';
import { newRoomId, newAdminToken, hashToken } from '../lib/id.ts';
import { validateCreateRoom } from '../lib/validate.ts';
import { getOrIssuePt } from '../lib/participant.ts';

export const rooms = new Hono();

const ROOM_ID_RE = /^[0-9A-Za-z]{8}$/;

rooms.post('/api/rooms', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: '请求体必须是合法 JSON', field: 'body' }, 400);
  }
  const v = validateCreateRoom(raw);
  if (!v.ok) {
    return c.json({ error: v.message, field: v.field }, 400);
  }
  const { title, options, allow_add } = v.value;

  const db = getDb();
  const adminToken = newAdminToken();
  const adminHash = hashToken(adminToken);
  const now = new Date().toISOString();

  let roomId = newRoomId();
  for (let i = 0; i < 5; i++) {
    const exists = db
      .prepare('SELECT 1 FROM rooms WHERE id = ?')
      .get(roomId);
    if (!exists) break;
    roomId = newRoomId();
  }

  const insertRoom = db.prepare(
    'INSERT INTO rooms (id, title, allow_add, admin_hash, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  insertRoom.run(roomId, title, allow_add ? 1 : 0, adminHash, now);

  const insertOpt = db.prepare(
    'INSERT INTO options (room_id, label, created_at) VALUES (?, ?, ?)',
  );
  for (const label of options) {
    insertOpt.run(roomId, label, now);
  }

  return c.json({
    room_id: roomId,
    admin_token: adminToken,
    url: `/r/${roomId}`,
  });
});

rooms.get('/api/rooms/:id', (c) => {
  const id = c.req.param('id');
  if (!ROOM_ID_RE.test(id)) {
    return c.json({ error: 'room id 格式非法' }, 404);
  }
  const db = getDb();
  const row = db
    .prepare('SELECT id, title, allow_add, created_at, closed_at FROM rooms WHERE id = ?')
    .get(id) as
    | {
        id: string;
        title: string;
        allow_add: number;
        created_at: string;
        closed_at: string | null;
      }
    | undefined;
  if (!row) {
    return c.json({ error: '房间不存在' }, 404);
  }
  getOrIssuePt(c);
  const opts = db
    .prepare(
      'SELECT id, label FROM options WHERE room_id = ? AND deleted_at IS NULL ORDER BY id',
    )
    .all(id) as { id: number; label: string }[];

  return c.json({
    id: row.id,
    title: row.title,
    allow_add: !!row.allow_add,
    created_at: row.created_at,
    closed_at: row.closed_at,
    options: opts.map((o) => ({ id: o.id, label: o.label })),
  });
});

rooms.post('/api/rooms/:id/options', async (c) => {
  const id = c.req.param('id');
  if (!ROOM_ID_RE.test(id)) return c.json({ error: 'room id 格式非法' }, 404);

  const db = getDb();
  const room = db
    .prepare('SELECT allow_add, closed_at FROM rooms WHERE id = ?')
    .get(id) as { allow_add: number; closed_at: string | null } | undefined;
  if (!room) return c.json({ error: '房间不存在' }, 404);
  if (room.closed_at) return c.json({ error: '投票已结束' }, 410);
  if (!room.allow_add) return c.json({ error: '本房间不允许追加候选项' }, 403);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: '请求体必须是合法 JSON' }, 400);
  }
  const labelRaw = (body as { label?: unknown }).label;
  if (typeof labelRaw !== 'string') {
    return c.json({ error: 'label 必须是字符串', field: 'label' }, 400);
  }
  const label = labelRaw.trim();
  if (label.length === 0) {
    return c.json({ error: 'label 不能为空', field: 'label' }, 400);
  }
  if (label.length > 80) {
    return c.json({ error: 'label 超长（>80）', field: 'label' }, 400);
  }

  const existing = db
    .prepare(
      'SELECT 1 FROM options WHERE room_id = ? AND LOWER(TRIM(label)) = LOWER(?)',
    )
    .get(id, label);
  if (existing) {
    return c.json({ error: '已存在同名候选项' }, 409);
  }

  const now = new Date().toISOString();
  const res = db
    .prepare('INSERT INTO options (room_id, label, created_at) VALUES (?, ?, ?)')
    .run(id, label, now);

  return c.json({ id: Number(res.lastInsertRowid), label });
});
