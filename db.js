import Database from "better-sqlite3";
import fs from "fs";

// ======================
// DATABASE (RAILWAY VOLUME)
// ======================

// Railway montuje volume w /data
const DB_DIR = "/data";
const DB_PATH = `${DB_DIR}/db.sqlite`;

// upewnij się, że katalog istnieje
fs.mkdirSync(DB_DIR, { recursive: true });

// SQLite na TRWAŁYM volume
export const db = new Database(DB_PATH);

// ======================
// USERS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    level INTEGER,

    -- magic link (na przyszłość)
    login_token TEXT,

    -- limit urządzeń (na przyszłość)
    devices_count INTEGER DEFAULT 0
  )
`).run();

// ======================
// COURSE PROGRESS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
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

// ======================
// READY
// ======================
console.log("✅ SQLite DB ready at", DB_PATH);
