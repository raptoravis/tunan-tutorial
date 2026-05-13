import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchRoom, fetchMyVote, submitVote, type Room as RoomT } from '../lib/api';

export function Room() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomT | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchRoom(id), fetchMyVote(id).catch(() => ({ selected: [] }))])
      .then(([r, mv]) => {
        setRoom(r);
        setSelected(new Set(mv.selected));
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="container">
        <p>加载中…</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="container">
        <h1>无法加载房间</h1>
        <p role="alert" className="error">
          {error ?? '未知错误'}
        </p>
        <p>
          <Link to="/">回到创建页</Link>
        </p>
      </main>
    );
  }

  const closed = !!room.closed_at;

  function toggle(optId: number) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
    setJustSaved(false);
  }

  async function onSubmit() {
    if (!id || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const ids = Array.from(selected);
      const res = await submitVote(id, ids);
      setSelected(new Set(res.selected));
      setJustSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>{room.title}</h1>
      {closed && (
        <p role="status" className="help">
          投票已结束。
        </p>
      )}

      <fieldset disabled={closed || submitting}>
        <legend>请勾选你的选择（可多选）</legend>
        <ul className="options">
          {room.options.map((o) => (
            <li key={o.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(o.id)}
                  onChange={() => toggle(o.id)}
                />
                {o.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {justSaved && !error && (
        <p role="status" className="help">
          已投票，可修改。
        </p>
      )}

      <button type="button" onClick={onSubmit} disabled={closed || submitting || selected.size === 0}>
        {closed ? '投票已结束' : submitting ? '提交中…' : '提交'}
      </button>

      <p style={{ marginTop: 32 }}>
        <Link to="/">再建一个</Link>
      </p>
    </main>
  );
}
