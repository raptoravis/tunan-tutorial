import { randomBytes } from 'node:crypto';
import type { Context } from 'hono';

const PT_RE = /(?:^|;\s*)pt=([0-9a-f]{64})/;

export function newParticipantToken(): string {
  return randomBytes(32).toString('hex');
}

export function parsePt(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(PT_RE);
  return m ? m[1] : null;
}

export function getOrIssuePt(c: Context): string {
  const existing = parsePt(c.req.header('cookie'));
  if (existing) return existing;
  const fresh = newParticipantToken();
  c.header('Set-Cookie', `pt=${fresh}; HttpOnly; SameSite=Lax; Path=/`);
  return fresh;
}
