console.log("🔥 SERVER.JS STARTED 🔥");
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";
import Database from "better-sqlite3";

const db = new Database("course.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS user_state (
    user_id TEXT PRIMARY KEY,
    level INTEGER,
    current_module TEXT,
    module_completed INTEGER,
    last_activity TEXT
  )
`).run();


const app = express();
app.use(express.json());



// ===== COOKIES =====
app.use((req, res, next) => {
  const raw = req.headers.cookie || "";
  req.cookies = Object.fromEntries(
    raw
      .split(";")
      .map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
      .filter(([k]) => k)
  );
  next();
});

// ===== USER IDENTIFICATION (PUBLIGO + COOKIE) =====
app.use((req, res, next) => {
  // 1. jeśli mamy cookie – użyj go
  if (req.cookies.course_user) {
    req.userId = req.cookies.course_user;
    return next();
  }

  // 2. jeśli przyszło z Publigo
  const publigoUid = req.query.publigo_uid;

  if (publigoUid) {
    const userId = `publigo_${publigoUid}`;

    res.setHeader(
      "Set-Cookie",
      `course_user=${userId}; Path=/; SameSite=Lax; Secure`
    );

    req.userId = userId;
    return next();
  }

  // 3. brak usera – dalej (fallback zrobi /api/me)
  req.userId = null;
  next();
});


// ===== SETUP =====
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== IN-MEMORY STORES =====
const progressStore = {};

// ===== HEALTH =====
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ===== MODULES =====
app.get("/api/modules", (req, res) => {
  res.json(modules);
});

// ===== USER =====
app.get("/api/me", (req, res) => {
  let userId = req.userId;

  if (!userId) {
    userId = "u_" + crypto.randomUUID();
    res.setHeader(
      "Set-Cookie",
`course_user=${userId}; Path=/; SameSite=Lax; Secure`
    );
  }

  res.json({ userId });
});





// ===== STATE =====
app.get("/api/state", (req, res) => {
  const userId = req.userId;
  if (!userId) return res.json({});

  const row = db.prepare(`
    SELECT level, current_module, module_completed, last_activity
    FROM user_state WHERE user_id=?
  `).get(userId);

  res.json({
level: Number.isInteger(row?.level) ? row.level : null,
currentModuleId:
  row?.current_module ??
  (row?.last_activity ? JSON.parse(row.last_activity).moduleId : null),
    moduleCompleted: Boolean(row?.module_completed),
    lastActivity: row?.last_activity
      ? JSON.parse(row.last_activity)
      : null
  });
});



app.post("/api/level", (req, res) => {
  const userId = req.userId;
  const level = Number(req.body?.level);

  if (!userId) return res.status(401).json({ error: "No user" });
  if (![1,2,3,4,5].includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }



  db.prepare(`
  INSERT INTO user_state (user_id, level, current_module, module_completed)
  VALUES (?, ?, NULL, 0)
  ON CONFLICT(user_id)
  DO UPDATE SET
    level=excluded.level,
    current_module=NULL,
    module_completed=0
`).run(userId, level);


  res.json({ ok: true, level });
});

// ===== PROGRESS =====
app.get("/api/progress", (req, res) => {
  const userId = req.userId;
  res.json(userId ? progressStore[userId] || {} : {});
});

app.post("/api/lesson-complete", (req, res) => {
  const userId = req.userId;
  const { moduleId, lessonId } = req.body;

  if (!userId || !moduleId || !lessonId) {
    return res.status(400).json({ ok: false });
  }

  progressStore[userId] ??= {};
  progressStore[userId][moduleId] ??= { completedLessons: {} };
  progressStore[userId][moduleId].completedLessons[lessonId] = true;

  res.json({ ok: true });
});

// ===== FEEDBACK =====
const modulesByLevel = {
  1: "module_1",
  2: "module_1",
  3: "module_1",
  4: "module_1",
  5: "module_1"
};

app.post("/api/feedback", (req, res) => {
  const userId = req.userId;
  const dir = req.body?.dir;

  if (!userId) return res.status(401).json({ error: "No user" });

  const row = db
    .prepare("SELECT level FROM user_state WHERE user_id=?")
    .get(userId);

  if (!row?.level)
    return res.status(400).json({ error: "Level not set" });

  let level = row.level;

  if (dir === "harder") level = Math.min(5, level + 1);
  if (dir === "easier") level = Math.max(1, level - 1);

  db.prepare(`
    UPDATE user_state SET level=? WHERE user_id=?
  `).run(level, userId);

  res.json({
    ok: true,
    level,
    moduleId: modulesByLevel[level]
  });
});

// ===== TRANSLATE (OPENAI) =====
app.post("/api/translate", async (req, res) => {
  try {
    const { word, sentence } = req.body;
    if (!word) return res.status(400).json({ error: "No word" });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Translate English words to Polish. Return only translation." },
        { role: "user", content: `Translate "${word}" in:\n${sentence || ""}` }
      ],
      temperature: 0.2
    });

    res.json({ translation: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translate failed" });
  }
});
// ===== DEBUG OPENAI KEY =====
app.get("/api/debug-key", (req, res) => {
  res.json({
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    keyLength: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.length
      : 0,
    keyPrefix: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.slice(0, 7) + "..."
      : null
  });
});
// ===== PUBLIGO WEBHOOK =====
app.post("/api/publigo-webhook", (req, res) => {
  console.log("📩 PUBLIGO WEBHOOK RECEIVED");
  console.log(JSON.stringify(req.body, null, 2));

  const data = req.body;

  // PRZYKŁADOWE POLA (zabezpieczenie)
  const publigoUserId =
    data?.customer?.user_id ||
    data?.customer?.id ||
    data?.user_id ||
    null;

  const email =
    data?.customer?.email ||
    data?.email ||
    null;

  const productId =
    data?.product?.id ||
    data?.product_id ||
    null;

  if (!publigoUserId) {
    console.log("❌ Brak publigo user_id");
    return res.status(200).json({ ok: false });
  }

  const internalUserId = `publigo_${publigoUserId}`;

  // zapisz mapowanie usera (na razie w pamięci)

  console.log("✅ User mapped:", internalUserId);

  res.status(200).json({ ok: true });
});
app.post("/api/last-activity", (req, res) => {
  const userId = req.userId;
  const { moduleId, activityId, variantId } = req.body;

  if (!userId) return res.status(401).json({ error: "No user" });

  const lastActivity = {
    moduleId,
    activityId,
    variantId: variantId || null
  };


  db.prepare(`
    INSERT INTO user_state (user_id, current_module, last_activity, module_completed)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(user_id)
    DO UPDATE SET
      current_module=excluded.current_module,
      last_activity=excluded.last_activity,
      module_completed=0
  `).run(
    userId,
    moduleId,
    JSON.stringify(lastActivity)
  );

  res.json({ ok: true });
});

app.post("/api/module-complete", (req, res) => {
  const userId = req.userId;
  const { moduleId } = req.body;

  if (!userId || !moduleId)
    return res.status(400).json({ error: "Missing data" });

  db.prepare(`
    INSERT INTO user_state (user_id, current_module, module_completed)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id)
    DO UPDATE SET
      current_module=excluded.current_module,
      module_completed=1
  `).run(userId, moduleId);

  res.json({ ok: true });
});

// ===== STATIC =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

// ===== FRONTEND =====
app.get("/course", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "course.html"));
});

// ===== START =====
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});













