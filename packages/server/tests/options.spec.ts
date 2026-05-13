import { describe, it, expect } from "vitest";
import { normalizeOptions } from "../src/options.js";

describe("normalizeOptions", () => {
  it("U-4 trims and deduplicates while preserving order", () => {
    expect(normalizeOptions(["杭州", " 杭州 ", "成都"])).toEqual([
      "杭州",
      "成都",
    ]);
  });

  it("U-5 drops empty/whitespace-only items", () => {
    expect(normalizeOptions(["", "  ", "成都"])).toEqual(["成都"]);
  });

  it("U-6 throws validation_failed for items over 80 chars", () => {
    const long = "a".repeat(81);
    expect(() => normalizeOptions([long, "ok"])).toThrowError(
      /validation_failed/,
    );
  });
});
