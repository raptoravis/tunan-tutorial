import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initDb, DB_PATH } from '../db.js';

const dataDir = path.dirname(DB_PATH);

beforeEach(() => {
  if (existsSync(DB_PATH)) rmSync(DB_PATH);
});

describe('initDb', () => {
  it('creates voting.db with topics/options/votes tables', () => {
    const db = initDb();
    expect(existsSync(DB_PATH)).toBe(true);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('topics');
    expect(names).toContain('options');
    expect(names).toContain('votes');
    db.close();
  });

  it('is idempotent (second init does not throw)', () => {
    const db1 = initDb();
    db1.close();
    expect(() => {
      const db2 = initDb();
      db2.close();
    }).not.toThrow();
  });
});
