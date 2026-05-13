import { describe, it, expect } from 'vitest';
import { db } from './db.js';

describe('node:sqlite db', () => {
  it('can SELECT 1', () => {
    const stmt = db.prepare('SELECT 1 as one');
    const row = stmt.get() as { one: number };
    expect(row.one).toBe(1);
  });
});
