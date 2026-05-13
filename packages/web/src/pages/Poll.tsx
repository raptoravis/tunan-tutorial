import { useEffect, useState } from "react";
import { getPoll, vote, type PollDetail, type VoteResponse } from "../api.js";

interface Props {
  shortCode: string;
}

type View = "loading" | "voting" | "results" | "error";

export function Poll({ shortCode }: Props) {
  const [view, setView] = useState<View>("loading");
  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<number>>(new Set());
  const [errMsg, setErrMsg] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPoll(shortCode)
      .then((p) => {
        setPoll(p);
        setView("voting");
      })
      .catch((e) => {
        setErrMsg(e instanceof Error ? e.message : "加载失败");
        setView("error");
      });
  }, [shortCode]);

  const shareUrl = `${window.location.origin}/p/${shortCode}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !poll) return;
    const ids =
      poll.mode === "multi"
        ? [...selectedMulti]
        : selected !== null
          ? [selected]
          : [];
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      const r: VoteResponse = await vote(shortCode, ids);
      setPoll({ ...poll, totalVotes: r.totalVotes, results: r.results });
      setView("results");
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "投票失败");
      setSubmitting(false);
    }
  };

  const toggleMulti = (id: number) => {
    setSelectedMulti((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit =
    poll?.mode === "multi" ? selectedMulti.size > 0 : selected !== null;

  if (view === "loading") return <p>加载中...</p>;
  if (view === "error") return <p role="alert">出错：{errMsg}</p>;
  if (!poll) return null;

  return (
    <div className="poll">
      <div className="share">
        <span>分享链接：</span>
        <code>{shareUrl}</code>
        <button type="button" onClick={onCopy}>
          {copied ? "已复制" : "复制"}
        </button>
      </div>

      <h2>{poll.title}</h2>

      {view === "voting" && (
        <form onSubmit={onSubmit}>
          <fieldset>
            <legend className="sr-only">
              {poll.mode === "multi" ? "选项（可多选）" : "选项（单选）"}
            </legend>
            {poll.options.map((o) =>
              poll.mode === "multi" ? (
                <label key={o.id} className="option-row">
                  <input
                    type="checkbox"
                    name="opt"
                    value={o.id}
                    checked={selectedMulti.has(o.id)}
                    onChange={() => toggleMulti(o.id)}
                  />
                  <span>{o.label}</span>
                </label>
              ) : (
                <label key={o.id} className="option-row">
                  <input
                    type="radio"
                    name="opt"
                    value={o.id}
                    checked={selected === o.id}
                    onChange={() => setSelected(o.id)}
                  />
                  <span>{o.label}</span>
                </label>
              ),
            )}
          </fieldset>
          {errMsg && (
            <p className="error" role="alert">
              {errMsg}
            </p>
          )}
          <button type="submit" className="btn primary" disabled={!canSubmit || submitting}>
            {submitting ? "提交中..." : "提交投票"}
          </button>
        </form>
      )}

      {view === "results" && (
        <div className="results" aria-live="polite">
          <h3>结果（共 {poll.totalVotes} 票）</h3>
          <ol>
            {poll.results.map((r) => (
              <li key={r.optionId}>
                <div className="row">
                  <span className="label">{r.label}</span>
                  <span className="count">
                    {r.count} ({r.percent}%)
                  </span>
                </div>
                <div className="bar" style={{ width: `${r.percent}%` }} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
