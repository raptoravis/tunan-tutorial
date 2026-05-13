import type { DatabaseSync } from 'node:sqlite';

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS options (
      id       TEXT PRIMARY KEY,
      poll_id  TEXT NOT NULL,
      text     TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id)
    );
    CREATE INDEX IF NOT EXISTS idx_options_poll ON options(poll_id);
    CREATE TABLE IF NOT EXISTS votes (
      poll_id   TEXT NOT NULL,
      voter     TEXT NOT NULL,
      option_id TEXT NOT NULL,
      voted_at  INTEGER NOT NULL,
      PRIMARY KEY (poll_id, voter),
      FOREIGN KEY (poll_id) REFERENCES polls(id),
      FOREIGN KEY (option_id) REFERENCES options(id)
    );
  `);
}
