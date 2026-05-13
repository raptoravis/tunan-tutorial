import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let db: DatabaseSync | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  allow_add INTEGER NOT NULL DEFAULT 0,
  admin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_options_room ON options(room_id);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  participant_token TEXT NOT NULL,
  option_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (option_id) REFERENCES options(id)
);

CREATE INDEX IF NOT EXISTS idx_votes_room_participant ON votes(room_id, participant_token);
`;

export function openDb(path: string): void {
  if (db) {
    db.close();
    db = null;
  }
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error('db not open; call openDb() first');
  return db;
}
