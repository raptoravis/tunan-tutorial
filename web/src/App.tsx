import { useEffect, useState } from 'react';

export function App() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'down'>('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? 'ok' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Voting</h1>
      <p>API status: {status === 'loading' ? '…' : status === 'ok' ? 'API ok' : 'API down'}</p>
    </main>
  );
}
