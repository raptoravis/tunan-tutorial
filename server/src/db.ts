import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(__dirname, '..', 'data');
export const DB_PATH = path.join(DATA_DIR, 'voting.db');

const DDL = `
CREATE TABLE IF NOT EXISTS topics (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS options (
  id        TEXT PRIMARY KEY,
  topic_id  TEXT NOT NULL,
  label     TEXT NOT NULL,
  position  INTEGER NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS votes (
  id          TEXT PRIMARY KEY,
  topic_id    TEXT NOT NULL,
  option_id   TEXT NOT NULL,
  voter_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  UNIQUE (topic_id, voter_id),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  FOREIGN KEY (option_id) REFERENCES options(id)
);
`;

export function initDb(dbPath: string = DB_PATH): DatabaseSync {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(DDL);
  return db;
}
