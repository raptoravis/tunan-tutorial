import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SCHEMA } from './schema.js';

const dbPath = resolve(process.cwd(), 'data', 'voting.db');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

let schemaApplied = false;
export function ensureSchema(): void {
  if (schemaApplied) return;
  db.exec(SCHEMA);
  schemaApplied = true;
}
