import { useParams, Link } from 'react-router-dom';

export function Room() {
  const { id } = useParams();
  return (
    <main className="container">
      <h1>房间 {id}</h1>
      <p>投票功能将在 STORY-002 实现。</p>
      <p>
        <Link to="/">回到创建页</Link>
      </p>
    </main>
  );
}
