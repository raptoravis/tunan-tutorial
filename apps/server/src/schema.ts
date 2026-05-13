export const SCHEMA = `
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  admin_token TEXT NOT NULL,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vote_options (
  vote_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (vote_id, idx),
  FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS vote_sessions (
  vote_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  option_idx INTEGER NOT NULL,
  voted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (vote_id, session_token)
);
`;
