import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function genShortCode(length = 8): string {
  // Reject-sample bytes < 248 (4*62) to avoid modulo bias.
  const out: string[] = [];
  while (out.length < length) {
    const chunk = randomBytes(length * 2);
    for (let i = 0; i < chunk.length && out.length < length; i++) {
      const b = chunk[i]!;
      if (b < 248) out.push(ALPHABET[b % 62]!);
    }
  }
  return out.join("");
}
