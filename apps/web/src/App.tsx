import { useEffect, useState } from 'react';
import { CreateVote } from './CreateVote.js';

function useHashRoute(): string {
  const [hash, setHash] = useState<string>(window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function VotePagePlaceholder({ voteId }: { voteId: string }) {
  return (
    <section>
      <h2>投票 {voteId}</h2>
      <p style={{ color: '#666' }}>（投票页将在 STORY-003 实现）</p>
      <p>
        <a href="#/">← 回到首页</a>
      </p>
    </section>
  );
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
      {voteMatch ? <VotePagePlaceholder voteId={voteMatch[1]} /> : <CreateVote />}
    </main>
  );
}
