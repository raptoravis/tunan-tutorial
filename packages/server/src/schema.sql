CREATE TABLE IF NOT EXISTS polls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code  TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  mode        TEXT NOT NULL DEFAULT 'single',
  deadline_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS options (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id  INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  idx      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS options_poll_idx ON options(poll_id, idx);

CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id     INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id   INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS votes_poll_idx ON votes(poll_id);
