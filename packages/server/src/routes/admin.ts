import { Hono } from 'hono';
import { getDb } from '../db.ts';
import { verifyAdminToken } from '../lib/auth.ts';

export const admin = new Hono();

const ROOM_ID_RE = /^[0-9A-Za-z]{8}$/;

type RoomAdminRow = {
  id: string;
  admin_hash: string;
  closed_at: string | null;
};

function authRoom(roomId: string, providedToken: string | undefined): RoomAdminRow | { error: number } {
  if (!ROOM_ID_RE.test(roomId)) return { error: 404 };
  const row = getDb()
    .prepare('SELECT id, admin_hash, closed_at FROM rooms WHERE id = ?')
    .get(roomId) as RoomAdminRow | undefined;
  if (!row) return { error: 404 };
  if (!verifyAdminToken(providedToken, row.admin_hash)) return { error: 403 };
  return row;
}

admin.post('/api/rooms/:id/close', (c) => {
  const id = c.req.param('id');
  const token = c.req.header('x-admin-token');
  const r = authRoom(id, token);
  if ('error' in r) {
    if (r.error === 403) return c.json({ error: '管理凭据无效' }, 403);
    return c.json({ error: '房间不存在' }, 404);
  }

  const db = getDb();
  if (r.closed_at) {
    return c.json({ closed_at: r.closed_at });
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE rooms SET closed_at = ? WHERE id = ?').run(now, id);
  return c.json({ closed_at: now });
});

admin.delete('/api/rooms/:id/options/:optionId', (c) => {
  const id = c.req.param('id');
  const token = c.req.header('x-admin-token');
  const r = authRoom(id, token);
  if ('error' in r) {
    if (r.error === 403) return c.json({ error: '管理凭据无效' }, 403);
    return c.json({ error: '房间不存在' }, 404);
  }
  const optionId = Number(c.req.param('optionId'));
  if (!Number.isInteger(optionId) || optionId <= 0) {
    return c.json({ error: 'option id 非法' }, 404);
  }

  const db = getDb();
  const opt = db
    .prepare(
      'SELECT id FROM options WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
    )
    .get(optionId, id) as { id: number } | undefined;
  if (!opt) return c.json({ error: 'option 不存在或已删除' }, 404);

  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE options SET deleted_at = ? WHERE id = ?').run(now, optionId);
    db.prepare('DELETE FROM votes WHERE option_id = ?').run(optionId);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return c.json({ deleted: optionId });
});
