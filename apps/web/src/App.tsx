import { useEffect, useState } from 'react';

type Health = { ok: boolean; db: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((h: Health) => setHealth(h))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Voting App</h1>
      <p>
        server health:{' '}
        {error ? (
          <span style={{ color: 'red' }}>error: {error}</span>
        ) : health ? (
          <span>
            ok={String(health.ok)} db={health.db}
          </span>
        ) : (
          <span>loading…</span>
        )}
      </p>
    </main>
  );
}
