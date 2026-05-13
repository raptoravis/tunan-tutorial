import { useEffect, useState } from 'react';
import { getVote, type VoteDetail } from './api.js';

const POLL_MS = 5000;

export function VotePage({ voteId }: { voteId: string }) {
  const [vote, setVote] = useState<VoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const v = await getVote(voteId);
        if (!cancelled) {
          setVote(v);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [voteId]);

  if (error === 'not_found') {
    return (
      <section>
        <h2>找不到投票 {voteId}</h2>
        <p>
          <a href="#/">← 回到首页</a>
        </p>
      </section>
    );
  }
  if (!vote) return <p>加载中…</p>;

  const total = vote.options.reduce((s, o) => s + o.count, 0);
  const youLabel =
    vote.you_voted_idx !== null
      ? vote.options.find((o) => o.idx === vote.you_voted_idx)?.label
      : null;

  return (
    <section>
      <h2>{vote.title}</h2>
      {vote.closed && <p style={{ color: '#a33' }}>投票已关闭</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vote.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          return (
            <li key={opt.idx} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{opt.label}</span>
                <span>
                  {opt.count} 票 ({pct}%)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#eee',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: '#4a90e2',
                    transition: 'width 250ms',
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <footer style={{ marginTop: 16, color: '#666' }}>
        {youLabel != null ? `已投：${youLabel}` : '尚未投票（投票交互将在 STORY-004 实现）'}
        <span style={{ float: 'right' }}>总票数：{total}</span>
      </footer>
    </section>
  );
}
