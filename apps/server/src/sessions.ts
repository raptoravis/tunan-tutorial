import type { Context } from 'hono';
import { newSessionToken } from './ids.js';

const COOKIE_NAME = 'vsession';

export function readSessionToken(c: Context): string | null {
  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME && v && /^[a-f0-9]{32}$/.test(v)) return v;
  }
  return null;
}

export function ensureSession(c: Context): string {
  const existing = readSessionToken(c);
  if (existing) return existing;
  const fresh = newSessionToken();
  c.header(
    'Set-Cookie',
    `${COOKIE_NAME}=${fresh}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`,
    { append: true },
  );
  return fresh;
}
