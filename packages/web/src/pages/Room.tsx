import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchRoom,
  fetchMyVote,
  fetchResults,
  submitVote,
  addOption,
  type Room as RoomT,
  type Results,
} from '../lib/api';

const POLL_MS = 1500;

export function Room() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomT | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchRoom(id),
      fetchMyVote(id).catch(() => ({ selected: [] })),
      fetchResults(id).catch(() => null),
    ])
      .then(([r, mv, rs]) => {
        setRoom(r);
        setSelected(new Set(mv.selected));
        if (rs) setResults(rs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !room) return;
    const timer = window.setInterval(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const r = await fetchResults(id);
        setResults(r);
      } catch {
        /* ignore transient errors */
      } finally {
        inFlight.current = false;
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [id, room]);

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
      const res = await submitVote(id, Array.from(selected));
      setSelected(new Set(res.selected));
      setJustSaved(true);
      const r = await fetchResults(id);
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function onAddOption(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    setAddError(null);
    try {
      await addOption(id, label);
      const refreshed = await fetchRoom(id);
      setRoom(refreshed);
      setNewLabel('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '追加失败');
    } finally {
      setAdding(false);
    }
  }

  const total = results?.total_participants ?? 0;

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

      <button
        type="button"
        onClick={onSubmit}
        disabled={closed || submitting || selected.size === 0}
      >
        {closed ? '投票已结束' : submitting ? '提交中…' : '提交'}
      </button>

      {room.allow_add && !closed && (
        <form className="add-option" onSubmit={onAddOption}>
          <label htmlFor="new-opt" className="sr-only">
            追加新候选项
          </label>
          <input
            id="new-opt"
            type="text"
            placeholder="追加新候选项"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            maxLength={80}
          />
          <button type="submit" disabled={adding || newLabel.trim().length === 0}>
            {adding ? '添加中…' : '+ 添加'}
          </button>
          {addError && (
            <p role="alert" className="error">
              {addError}
            </p>
          )}
        </form>
      )}

      <section className="results" aria-live="polite">
        <h2>当前结果</h2>
        <p className="help">参与人数：{total}</p>
        <ul className="results-list">
          {(results?.options ?? room.options.map((o) => ({ ...o, votes: 0 }))).map((o) => {
            const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
            return (
              <li key={o.id}>
                <div className="results-row">
                  <span className="results-label">{o.label}</span>
                  <span className="results-count">
                    {o.votes} 票 ({pct}%)
                  </span>
                </div>
                <div className="bar" aria-hidden="true">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p style={{ marginTop: 32 }}>
        <Link to="/">再建一个</Link>
      </p>
    </main>
  );
}
