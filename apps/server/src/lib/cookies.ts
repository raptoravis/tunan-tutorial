import type { Context } from 'hono';
import { newToken } from './id.js';

export const OWNER_COOKIE = 'owner_token';
export const VOTER_COOKIE = 'voter_id';

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v;
  }
  return undefined;
}

export function getCookie(c: Context, name: string): string | undefined {
  return parseCookie(c.req.header('cookie'), name);
}

export function setCookie(c: Context, name: string, value: string): void {
  const attrs = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=31536000',
  ].join('; ');
  c.header('set-cookie', attrs, { append: true });
}

export function ensureVoterId(c: Context): string {
  let id = getCookie(c, VOTER_COOKIE);
  if (!id) {
    id = newToken();
    setCookie(c, VOTER_COOKIE, id);
  }
  return id;
}
