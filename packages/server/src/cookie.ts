export const VOTED_COOKIE = "voted_polls";

export function parseVotedCookie(header: string | null | undefined): string[] {
  if (!header) return [];
  const match = header
    .split(/;\s*/)
    .map((p) => p.split("="))
    .find(([k]) => k === VOTED_COOKIE);
  if (!match || !match[1]) return [];
  try {
    const decoded = Buffer.from(decodeURIComponent(match[1]), "base64").toString("utf-8");
    const arr = JSON.parse(decoded) as unknown;
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) return arr;
    return [];
  } catch {
    return [];
  }
}

export function serializeVotedCookie(codes: string[]): string {
  const payload = encodeURIComponent(Buffer.from(JSON.stringify(codes), "utf-8").toString("base64"));
  return `${VOTED_COOKIE}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000`;
}
