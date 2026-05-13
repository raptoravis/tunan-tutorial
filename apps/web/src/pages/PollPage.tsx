import { useEffect, useState, type FormEvent } from 'react';
import { getPoll, castVote, type Poll } from '../api.js';

interface Props {
  id: string;
}

export function PollPage({ id }: Props) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPoll(id)
      .then((p) => {
        if (cancelled) return;
        setPoll(p);
        setSelected(p.your_option_id);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const refresh = async () => {
    const p = await getPoll(id);
    setPoll(p);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setFormError('请选择一项');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await castVote(id, selected);
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '投票失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (error === 'not_found') {
    return (
      <main style={{ maxWidth: 540, margin: '40px auto', padding: '0 16px' }}>
        <h1>投票不存在</h1>
        <a href="/">回首页</a>
      </main>
    );
  }
  if (error) return <p role="alert">{error}</p>;
  if (!poll) return <p>加载中…</p>;

  const deadline = poll.deadline_at ? new Date(poll.deadline_at) : null;

  return (
    <main style={{ maxWidth: 540, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>{poll.title}</h1>
      {deadline && <p style={{ color: '#666' }}>截止：{deadline.toLocaleString()}</p>}
      {poll.closed && (
        <p role="status" style={{ color: 'crimson' }}>
          投票已截止
        </p>
      )}

      <form onSubmit={onSubmit} aria-label="vote-form">
        <ul aria-label="poll-options" style={{ listStyle: 'none', padding: 0 }}>
          {poll.options.map((o) => (
            <li key={o.id} style={{ marginBottom: 6 }}>
              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: 8,
                  border: '1px solid',
                  borderColor: selected === o.id ? '#0a7' : '#ccc',
                  borderRadius: 4,
                  cursor: poll.closed ? 'not-allowed' : 'pointer',
                  background: poll.your_option_id === o.id ? '#eafaf1' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="option"
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  disabled={poll.closed}
                  aria-label={`vote-${o.id}`}
                />
                <span>{o.label}</span>
                {poll.your_option_id === o.id && (
                  <span aria-label="your-choice" style={{ color: '#0a7', fontSize: 12 }}>
                    （你的选择）
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
        {formError && (
          <p role="alert" style={{ color: 'crimson' }}>
            {formError}
          </p>
        )}
        <button type="submit" disabled={submitting || poll.closed} style={{ padding: '8px 16px' }}>
          {submitting ? '提交中…' : poll.your_option_id ? '改票' : '提交投票'}
        </button>
      </form>

      <p style={{ color: '#999', fontSize: 12, marginTop: 24 }}>
        分享链接：{window.location.href}
      </p>
    </main>
  );
}
