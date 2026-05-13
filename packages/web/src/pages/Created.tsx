import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export function Created() {
  const [params] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'token' | null>(null);

  useEffect(() => {
    const t = params.get('token');
    const i = params.get('id');
    setToken(t);
    setId(i);
    if (t || i) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }, [params]);

  if (!id || !token) {
    return (
      <main className="container">
        <h1>未找到房间信息</h1>
        <p>
          <Link to="/">回到创建页</Link>
        </p>
      </main>
    );
  }

  const link = `${window.location.origin}/r/${id}`;

  async function copy(text: string, kind: 'link' | 'token') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <main className="container">
      <h1>投票创建成功</h1>

      <section>
        <h2>房间链接</h2>
        <p className="mono">{link}</p>
        <button type="button" onClick={() => copy(link, 'link')}>
          {copied === 'link' ? '已复制 ✓' : '复制链接'}
        </button>
      </section>

      <section>
        <h2>管理 token（请妥善保存）</h2>
        <p className="mono token">{token}</p>
        <button type="button" onClick={() => copy(token, 'token')}>
          {copied === 'token' ? '已复制 ✓' : '复制 token'}
        </button>
        <p role="note" className="help">
          凭此 token 可关闭房间或删除候选项。本期不支持找回，请立即保存。
        </p>
      </section>

      <p>
        <Link to={`/r/${id}/admin?token=${encodeURIComponent(token)}`}>前往管理面板</Link>
        {' · '}
        <Link to="/">再建一个</Link>
      </p>
    </main>
  );
}
