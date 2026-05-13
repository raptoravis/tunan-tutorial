import { useState } from 'react';
import { createVote } from './api.js';

export function CreateVote() {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const trimmedOpts = options.map((o) => o.trim()).filter((o) => o.length > 0);
  const canSubmit =
    !busy && trimmedTitle.length > 0 && trimmedOpts.length >= 2 && trimmedOpts.length <= 10;

  function updateOption(i: number, v: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function addOption() {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, '']);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { id, admin_token } = await createVote({
        title: trimmedTitle,
        options: trimmedOpts,
      });
      localStorage.setItem(`vote:${id}:admin`, admin_token);
      window.location.hash = `#/v/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2>新建投票</h2>
      <label>
        标题
        <input
          type="text"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="周五午饭吃什么"
          style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>
      <div>
        <div style={{ marginBottom: 4 }}>候选项（2-10 个）</div>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              type="text"
              value={opt}
              maxLength={40}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`候选 ${i + 1}`}
              style={{ flex: 1, padding: 6 }}
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
              aria-label={`删除候选 ${i + 1}`}
            >
              −
            </button>
          </div>
        ))}
        <button type="button" onClick={addOption} disabled={options.length >= 10}>
          + 添加候选项
        </button>
      </div>
      {error && <div style={{ color: 'red' }}>错误：{error}</div>}
      <button type="submit" disabled={!canSubmit} style={{ padding: 10, fontSize: 16 }}>
        {busy ? '创建中…' : '创建投票'}
      </button>
    </form>
  );
}
