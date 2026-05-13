import { describe, it, expect } from "vitest";
import { genShortCode } from "../src/shortcode.js";

describe("shortcode", () => {
  it("U-1 returns string of length 8", () => {
    expect(genShortCode()).toHaveLength(8);
  });

  it("U-2 contains only base62 characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(genShortCode()).toMatch(/^[0-9A-Za-z]{8}$/);
    }
  });

  it("U-3 has no collisions across 1000 calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(genShortCode());
    expect(seen.size).toBe(1000);
  });
});
