import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function newVoteId(): string {
  const bytes = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return s;
}

export function newAdminToken(): string {
  return randomBytes(32).toString('hex');
}

export function newSessionToken(): string {
  return randomBytes(16).toString('hex');
}
