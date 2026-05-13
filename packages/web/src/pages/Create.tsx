import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/api';

const TITLE_MAX = 120;
const OPTION_MAX = 80;

export function Create() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowAdd, setAllowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
  const canSubmit =
    title.trim().length > 0 &&
    title.trim().length <= TITLE_MAX &&
    trimmedOptions.length >= 2 &&
    trimmedOptions.every((o) => o.length <= OPTION_MAX) &&
    !submitting;

  function updateOption(i: number, v: string) {
    setOptions((cur) => cur.map((o, idx) => (idx === i ? v : o)));
  }
  function addOption() {
    setOptions((cur) => [...cur, '']);
  }
  function removeOption(i: number) {
    setOptions((cur) => (cur.length <= 2 ? cur : cur.filter((_, idx) => idx !== i)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createRoom({
        title: title.trim(),
        options: trimmedOptions,
        allow_add: allowAdd,
      });
      nav(`/created?id=${encodeURIComponent(res.room_id)}&token=${encodeURIComponent(res.admin_token)}`, {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>创建投票</h1>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            required
            aria-describedby="title-help"
          />
          <small id="title-help" className="help">
            最多 {TITLE_MAX} 字（如：周五午餐吃啥）
          </small>
        </div>

        <fieldset>
          <legend>候选项（至少 2 个）</legend>
          {options.map((o, i) => (
            <div className="field row" key={i}>
              <label htmlFor={`opt-${i}`} className="sr-only">
                候选项 {i + 1}
              </label>
              <input
                id={`opt-${i}`}
                type="text"
                value={o}
                onChange={(e) => updateOption(i, e.target.value)}
                maxLength={OPTION_MAX}
                placeholder={`候选项 ${i + 1}`}
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} aria-label={`删除候选项 ${i + 1}`}>
                  删除
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption}>
            + 添加候选项
          </button>
        </fieldset>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={allowAdd}
              onChange={(e) => setAllowAdd(e.target.checked)}
            />
            允许参与者追加候选项
          </label>
        </div>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit}>
          {submitting ? '创建中…' : '创建'}
        </button>
      </form>
    </main>
  );
}
