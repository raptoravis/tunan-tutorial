import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface PollDetail {
  id: string;
  title: string;
  options: Array<{ id: string; text: string; count: number }>;
  totalVotes: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; poll: PollDetail }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export function PollPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/polls/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setState({ kind: 'not_found' });
          return;
        }
        if (!r.ok) {
          setState({ kind: 'error', message: `加载失败 (${r.status})` });
          return;
        }
        const poll = (await r.json()) as PollDetail;
        setState({ kind: 'ready', poll });
      })
      .catch((e: Error) => setState({ kind: 'error', message: e.message }));
  }, [id]);

  if (state.kind === 'loading') return <p>加载中…</p>;
  if (state.kind === 'not_found') return <p>找不到这个投票</p>;
  if (state.kind === 'error') return <p role="alert">{state.message}</p>;

  return (
    <section>
      <h2>{state.poll.title}</h2>
      <ul>
        {state.poll.options.map((o) => (
          <li key={o.id}>
            <label>
              <input type="radio" name="option" value={o.id} disabled />
              {o.text}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
