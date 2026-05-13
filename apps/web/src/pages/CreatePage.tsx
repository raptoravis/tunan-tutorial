import { useState, type FormEvent } from 'react';
import { createPoll } from '../api.js';

const OPT_MIN = 2;
const OPT_MAX = 10;

interface Props {
  onCreated: (id: string) => void;
}

export function CreatePage({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length >= OPT_MAX) return;
    setOptions([...options, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= OPT_MIN) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, value: string) => {
    setOptions(options.map((o, idx) => (idx === i ? value : o)));
  };

  const validate = (): string | null => {
    if (title.trim().length === 0) return '请填写标题';
    if (title.trim().length > 100) return '标题最多 100 字';
    const trimmed = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (trimmed.length < OPT_MIN) return `至少需要 ${OPT_MIN} 个候选项`;
    if (trimmed.length > OPT_MAX) return `最多 ${OPT_MAX} 个候选项`;
    if (new Set(trimmed).size !== trimmed.length) return '候选项不能重复';
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        options: options.map((o) => o.trim()).filter((o) => o.length > 0),
        ...(deadline ? { deadline_at: new Date(deadline).toISOString() } : {}),
      };
      const { id } = await createPoll(body);
      onCreated(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 540, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>发起一个投票</h1>
      <form onSubmit={onSubmit} aria-label="create-poll-form">
        <label style={{ display: 'block', marginBottom: 8 }}>
          <span>标题</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="比如：今天中饭吃啥？"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            aria-label="title"
          />
        </label>

        <fieldset style={{ marginBottom: 8 }}>
          <legend>候选项（2 - 10 个）</legend>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`选项 ${i + 1}`}
                style={{ flex: 1, padding: 8 }}
                aria-label={`option-${i}`}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={options.length <= OPT_MIN}
                aria-label={`remove-option-${i}`}
              >
                删
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= OPT_MAX}
            style={{ marginTop: 8 }}
          >
            + 加候选项
          </button>
        </fieldset>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span>截止时间（可选）</span>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ display: 'block', padding: 8, marginTop: 4 }}
            aria-label="deadline"
          />
        </label>

        {error && (
          <p role="alert" style={{ color: 'crimson' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} style={{ padding: '8px 16px' }}>
          {submitting ? '创建中…' : '创建投票'}
        </button>
      </form>
    </main>
  );
}
