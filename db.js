import Database from "better-sqlite3";

// tworzymy / otwieramy bazę
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
// PROGRESS
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT,
    module_id TEXT,
    lesson_id TEXT,
    PRIMARY KEY (user_id, module_id, lesson_id)
  )
`).run();
