import { DatabaseSync } from 'node:sqlite';

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(':memory:');
    db.exec(SCHEMA);
  }
  return db;
}

export function resetDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS polls (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  deadline_at TEXT,
  owner_token TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_options (
  id       TEXT PRIMARY KEY,
  poll_id  TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  poll_id    TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_id   TEXT NOT NULL,
  option_id  TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (poll_id, voter_id)
);
`;
