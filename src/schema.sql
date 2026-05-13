CREATE TABLE IF NOT EXISTS polls (
  id              TEXT PRIMARY KEY,
  question        TEXT NOT NULL,
  deadline_ms     INTEGER NOT NULL,
  admin_token     TEXT NOT NULL UNIQUE,
  public_details  INTEGER NOT NULL DEFAULT 0,
  created_at_ms   INTEGER NOT NULL,
  closed_at_ms    INTEGER
);

CREATE TABLE IF NOT EXISTS options (
  id              TEXT PRIMARY KEY,
  poll_id         TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  created_at_ms   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_options_poll ON options(poll_id);
