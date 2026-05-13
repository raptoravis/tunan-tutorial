import { useEffect, useState } from 'react';
import { CreatePage } from './pages/CreatePage.js';
import { PollPage } from './pages/PollPage.js';

function getRoute(): { name: 'home' } | { name: 'poll'; id: string } {
  const path = window.location.pathname;
  const m = path.match(/^\/p\/([^/]+)\/?$/);
  if (m) return { name: 'poll', id: m[1] };
  return { name: 'home' };
}

export function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
  };

  if (route.name === 'poll') return <PollPage id={route.id} onDeleted={() => navigate('/')} />;
  return <CreatePage onCreated={(id) => navigate(`/p/${id}`)} />;
}
