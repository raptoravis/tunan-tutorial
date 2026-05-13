import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setOption = (i: number, v: string) => {
    setOptions((cur) => cur.map((o, idx) => (idx === i ? v : o)));
  };

  const addOption = () => setOptions((cur) => (cur.length < 20 ? [...cur, ''] : cur));
  const removeOption = (i: number) =>
    setOptions((cur) => (cur.length > 2 ? cur.filter((_, idx) => idx !== i) : cur));

  const canSubmit =
    !submitting && title.trim().length > 0 && options.every((o) => o.trim().length > 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), options: options.map((o) => o.trim()) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `创建失败 (${res.status})`);
        return;
      }
      const body = (await res.json()) as { id: string; url: string };
      navigate(`/poll/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label>
        标题
        <input
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </label>
      <ol>
        {options.map((opt, i) => (
          <li key={i}>
            <input
              placeholder={`选项 ${i + 1}`}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              maxLength={50}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} aria-label={`删除选项 ${i + 1}`}>
                删
              </button>
            )}
          </li>
        ))}
      </ol>
      <button type="button" onClick={addOption} disabled={options.length >= 20}>
        加选项
      </button>
      <button type="submit" disabled={!canSubmit}>
        创建
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
