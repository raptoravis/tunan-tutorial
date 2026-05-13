import { useState } from "react";
import { createPoll } from "../api.js";

interface Props {
  navigate: (path: string) => void;
}

export function NewPoll({ navigate }: Props) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = options.map((o) => o.trim()).filter((o) => o.length > 0);
  const canSubmit = title.trim().length > 0 && trimmed.length >= 2 && !submitting;

  const updateOption = (i: number, v: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  };

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (i: number) =>
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPoll({
        title: title.trim(),
        options: trimmed,
        mode: "single",
      });
      navigate(`/p/${res.shortCode}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "创建失败";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form className="new-poll" onSubmit={onSubmit} noValidate>
      <h2>创建投票</h2>

      <label htmlFor="title">话题标题</label>
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例：周末去哪玩？"
        maxLength={120}
        required
      />

      <fieldset>
        <legend>选项（至少 2 项）</legend>
        {options.map((opt, i) => (
          <div className="option-row" key={i}>
            <label htmlFor={`opt-${i}`} className="sr-only">
              选项 {i + 1}
            </label>
            <input
              id={`opt-${i}`}
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`选项 ${i + 1}`}
              maxLength={80}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                aria-label={`删除选项 ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addOption} disabled={options.length >= 20}>
          + 加一项
        </button>
      </fieldset>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn primary" disabled={!canSubmit}>
        {submitting ? "创建中..." : "创建投票"}
      </button>
    </form>
  );
}
