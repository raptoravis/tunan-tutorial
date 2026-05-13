import { randomBytes, createHash } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function toBase62(buf: Buffer): string {
  let out = '';
  for (const b of buf) {
    out += ALPHABET[b % 62];
  }
  return out;
}

export function newRoomId(): string {
  return toBase62(randomBytes(8));
}

export function newAdminToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
