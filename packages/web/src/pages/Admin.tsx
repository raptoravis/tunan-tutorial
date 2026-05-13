import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchRoom, type Room } from '../lib/api';

async function closeRoom(id: string, token: string): Promise<{ closed_at: string }> {
  const res = await fetch(`/api/rooms/${id}/close`, {
    method: 'POST',
    headers: { 'x-admin-token': token },
  });
  if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error || `HTTP ${res.status}`);
  return (await res.json()) as { closed_at: string };
}

async function deleteOption(id: string, optionId: number, token: string): Promise<{ deleted: number }> {
  const res = await fetch(`/api/rooms/${id}/options/${optionId}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': token },
  });
  if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error || `HTTP ${res.status}`);
  return (await res.json()) as { deleted: number };
}

export function Admin() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState(params.get('token') ?? '');
  const [busy, setBusy] = useState<number | 'close' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    setError(null);
    try {
      setRoom(await fetchRoom(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
  }

  useEffect(() => {
    refresh();
    if (params.get('token')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return null;
  if (!room) {
    return (
      <main className="container">
        <p>加载中…</p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </main>
    );
  }

  async function onClose() {
    if (!token || !id) return;
    setBusy('close');
    setError(null);
    setInfo(null);
    try {
      await closeRoom(id, token);
      setInfo('房间已关闭');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(optId: number) {
    if (!token || !id) return;
    setBusy(optId);
    setError(null);
    setInfo(null);
    try {
      await deleteOption(id, optId, token);
      setInfo(`候选项已删除（id=${optId}）`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusy(null);
    }
  }

  const closed = !!room.closed_at;

  return (
    <main className="container">
      <h1>管理：{room.title}</h1>

      <section className="admin">
        <label htmlFor="token">管理 token</label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="粘贴创建时拿到的 token"
        />
      </section>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="help">
          {info}
        </p>
      )}

      <section className="admin">
        <h2>房间</h2>
        <p>
          状态：{closed ? '已关闭' : '进行中'}
          {closed && room.closed_at && ` · 关闭于 ${room.closed_at}`}
        </p>
        <button type="button" onClick={onClose} disabled={!token || closed || busy === 'close'}>
          {closed ? '已关闭' : busy === 'close' ? '关闭中…' : '关闭房间'}
        </button>
      </section>

      <section className="admin">
        <h2>候选项</h2>
        <ul className="options">
          {room.options.map((o) => (
            <li key={o.id}>
              <span>{o.label}</span>{' '}
              <button
                type="button"
                onClick={() => onDelete(o.id)}
                disabled={!token || busy === o.id}
              >
                {busy === o.id ? '删除中…' : '删除'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 32 }}>
        <Link to={`/r/${id}`}>← 投票页</Link>
      </p>
    </main>
  );
}
