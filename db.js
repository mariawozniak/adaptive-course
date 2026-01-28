import Database from "better-sqlite3";

// ======================
// DATABASE INIT
// ======================
export const db = new Database("data.db");

// ======================
// USERS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    level INTEGER,

    -- magic link
    login_token TEXT,

    -- limit urządzeń
    devices_count INTEGER DEFAULT 0
  )
`).run();

// ======================
// COURSE PROGRESS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT,
    module_id TEXT,
    lesson_id TEXT,
    PRIMARY KEY (user_id, module_id, lesson_id)
  )
`).run();

// ======================
// VOCABULARY PROGRESS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS vocabulary_progress (
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    word_id TEXT NOT NULL,

    -- status fiszki:
    -- "learning" = wciąż się uczę
    -- "known"    = umiem
    status TEXT NOT NULL CHECK(status IN ('learning','known')),

    updated_at INTEGER NOT NULL,

    PRIMARY KEY (user_id, module_id, word_id)
  )
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_vocab_user_module
  ON vocabulary_progress (user_id, module_id)
`).run();
