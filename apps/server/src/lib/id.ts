import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid10 = customAlphabet(alphabet, 10);
const nanoid32 = customAlphabet(alphabet, 32);

export function newPollId(): string {
  return nanoid10();
}

export function newToken(): string {
  return nanoid32();
}
