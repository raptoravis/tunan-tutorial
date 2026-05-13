import { describe, it, expect } from "vitest";
import { aggregateResults } from "../src/results.js";

describe("aggregateResults", () => {
  it("U-7 returns desc-by-count with percentages", () => {
    const options = [
      { id: 1, label: "A", idx: 0 },
      { id: 2, label: "B", idx: 1 },
    ];
    const votes = [{ optionId: 1 }, { optionId: 1 }, { optionId: 2 }];
    const r = aggregateResults(options, votes);
    expect(r.totalVotes).toBe(3);
    expect(r.results[0]).toMatchObject({
      optionId: 1,
      label: "A",
      count: 2,
      percent: 67,
    });
    expect(r.results[1]).toMatchObject({
      optionId: 2,
      label: "B",
      count: 1,
      percent: 33,
    });
  });

  it("U-8 zero votes → all percent 0, total 0", () => {
    const options = [
      { id: 1, label: "A", idx: 0 },
      { id: 2, label: "B", idx: 1 },
    ];
    const r = aggregateResults(options, []);
    expect(r.totalVotes).toBe(0);
    expect(r.results.every((x) => x.count === 0 && x.percent === 0)).toBe(true);
  });

  it("U-9 ties break by option idx ascending", () => {
    const options = [
      { id: 1, label: "A", idx: 0 },
      { id: 2, label: "B", idx: 1 },
    ];
    const votes = [{ optionId: 1 }, { optionId: 2 }];
    const r = aggregateResults(options, votes);
    expect(r.results.map((x) => x.optionId)).toEqual([1, 2]);
  });
});
