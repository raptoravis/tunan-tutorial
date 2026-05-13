import { timingSafeEqual } from 'node:crypto';
import { hashToken } from './id.ts';

export function verifyAdminToken(provided: string | undefined, storedHash: string): boolean {
  if (!provided || typeof provided !== 'string') return false;
  const incomingHash = hashToken(provided);
  if (incomingHash.length !== storedHash.length) return false;
  try {
    return timingSafeEqual(Buffer.from(incomingHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}
