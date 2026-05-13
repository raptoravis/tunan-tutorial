import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { newSessionId } from './ids.js';

export const SESSION_COOKIE = 'vsid';

declare module 'hono' {
  interface ContextVariableMap {
    sid: string;
  }
}

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const existing = getCookie(c, SESSION_COOKIE);
  let sid: string;
  if (existing) {
    sid = existing;
  } else {
    sid = newSessionId();
    setCookie(c, SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  c.set('sid', sid);
  await next();
};

export function getSid(c: Context): string {
  return c.get('sid');
}
