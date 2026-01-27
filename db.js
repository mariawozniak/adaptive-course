import Database from "better-sqlite3";

export const db = new Database("data.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    level INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT,
    module_id TEXT,
    lesson_id TEXT,
    PRIMARY KEY (user_id, module_id, lesson_id)
  )
`).run();
