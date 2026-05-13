import { useEffect, useState } from 'react';
import { getPoll, type Poll } from '../api.js';

interface Props {
  id: string;
}

export function PollPage({ id }: Props) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPoll(id)
      .then((p) => {
        if (!cancelled) setPoll(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      {deadline && (
        <p style={{ color: '#666' }}>截止：{deadline.toLocaleString()}</p>
      )}
      <ul aria-label="poll-options">
        {poll.options.map((o) => (
          <li key={o.id}>{o.label}</li>
        ))}
      </ul>
      <p style={{ color: '#999', fontSize: 12 }}>
        分享链接：{window.location.href}
      </p>
    </main>
  );
}
