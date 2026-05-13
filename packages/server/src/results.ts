export interface OptionRow {
  id: number;
  label: string;
  idx: number;
}
export interface VoteRow {
  optionId: number;
}

export interface ResultEntry {
  optionId: number;
  label: string;
  count: number;
  percent: number;
}

export interface Aggregated {
  totalVotes: number;
  results: ResultEntry[];
}

export function aggregateResults(
  options: OptionRow[],
  votes: VoteRow[],
): Aggregated {
  const counts = new Map<number, number>();
  for (const o of options) counts.set(o.id, 0);
  for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);

  const totalVotes = votes.length;
  const results: ResultEntry[] = options.map((o) => {
    const count = counts.get(o.id) ?? 0;
    const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    return { optionId: o.id, label: o.label, count, percent };
  });

  results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const ai = options.find((o) => o.id === a.optionId)!.idx;
    const bi = options.find((o) => o.id === b.optionId)!.idx;
    return ai - bi;
  });

  return { totalVotes, results };
}
