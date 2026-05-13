import { useEffect, useState } from 'react';
import { CreateVote } from './CreateVote.js';
import { VotePage } from './VotePage.js';

function useHashRoute(): string {
  const [hash, setHash] = useState<string>(window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function App() {
  const hash = useHashRoute();
  const voteMatch = hash.match(/^#\/v\/([A-Za-z0-9]{8})$/);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>
        <a href="#/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Voting App
        </a>
      </h1>
      {voteMatch ? <VotePage voteId={voteMatch[1]} /> : <CreateVote />}
    </main>
  );
}
