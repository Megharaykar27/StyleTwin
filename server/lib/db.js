// SQLite database: one file (styletwin.db), created automatically.
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.DATABASE_FILE || path.join(here, "..", "styletwin.db");

export const db = new Database(file);
db.pragma("journal_mode = WAL"); // faster, safe concurrent reads
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clothes in the user's wardrobe (also used as try-on garments)
CREATE TABLE IF NOT EXISTS garments (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image       TEXT NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,           -- top | bottom | dress | outerwear | shoes | accessory
  color       TEXT NOT NULL,           -- main colour name
  color_hex   TEXT NOT NULL,
  pattern     TEXT NOT NULL DEFAULT 'solid',
  style       TEXT NOT NULL DEFAULT 'casual',
  formality   INTEGER NOT NULL DEFAULT 2, -- 1 relaxed … 5 formal
  seasons     TEXT NOT NULL DEFAULT '["all"]',
  in_wardrobe INTEGER NOT NULL DEFAULT 1, -- 0 = only uploaded for a single try-on
  tagged_by   TEXT NOT NULL DEFAULT 'ai',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS garments_user ON garments(user_id, in_wardrobe);

-- Every generated try-on (the lookbook)
CREATE TABLE IF NOT EXISTS tryons (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person      TEXT NOT NULL,
  garment_id  TEXT REFERENCES garments(id) ON DELETE SET NULL,
  garment     TEXT NOT NULL,
  result      TEXT NOT NULL,
  favorite    INTEGER NOT NULL DEFAULT 0,
  provider    TEXT NOT NULL,
  seconds     REAL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS tryons_user ON tryons(user_id, created_at);

-- One style profile per user
CREATE TABLE IF NOT EXISTS style_profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  photo      TEXT,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Small helpers so routes stay short
export const one = (sql, ...p) => db.prepare(sql).get(...p);
export const all = (sql, ...p) => db.prepare(sql).all(...p);
export const run = (sql, ...p) => db.prepare(sql).run(...p);
