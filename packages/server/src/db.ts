import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type DB = DatabaseSync;

export function openDb(file = "./data.sqlite"): DB {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON");
  if (file !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  const schema = readFileSync(resolve(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
  return db;
}
