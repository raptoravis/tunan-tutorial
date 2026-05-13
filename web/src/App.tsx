import React, { useEffect, useState } from 'react';

type Status = 'loading' | 'ok' | 'error';

export function App() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j: { ok: boolean }) => setStatus(j.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main>
      <h1>Voting System</h1>
      <p>API: {status}</p>
    </main>
  );
}
