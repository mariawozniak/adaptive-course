console.log("🔥 SERVER.JS STARTED 🔥");

import { db } from "./db.js";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";


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

// ===== USER IDENTIFICATION (COOKIE ONLY) =====
app.use((req, res, next) => {
  req.userId = req.cookies.course_user || null;
  next();
});


// ===== SETUP =====
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



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
  const userId = req.cookies.course_user;

  if (!userId) {
    return res.json({ userId: null, level: null });
  }

  const user = db
    .prepare("SELECT id, level FROM users WHERE id = ?")
    .get(userId);

  if (!user) {
    return res.json({ userId: null, level: null });
  }

  res.json({
    userId: user.id,
    level: user.level ?? null
  });
});


// ===== STATE =====
app.get("/api/state", (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.json({ level: null });
  }

  const user = db
    .prepare("SELECT level FROM users WHERE id = ?")
    .get(userId);

  res.json({
    level: user?.level ?? null
  });
});


app.post("/api/level", (req, res) => {
  const userId = req.cookies.course_user;
  const level = Number(req.body?.level);

  if (!userId) {
    return res.status(401).json({ error: "No user" });
  }

  if (![1, 2, 3, 4, 5].includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }

  db.prepare(`
    UPDATE users
    SET level = ?
    WHERE id = ?
  `).run(level, userId);

  res.json({ ok: true, level });
});


// ===== PROGRESS =====
app.get("/api/progress", (req, res) => {
  const userId = req.cookies.course_user;

  if (!userId) {
    return res.json({});
  }

  const rows = db.prepare(`
    SELECT module_id, lesson_id
    FROM progress
    WHERE user_id = ?
  `).all(userId);

  const result = {};

  for (const row of rows) {
    result[row.module_id] ??= { completedLessons: {} };
    result[row.module_id].completedLessons[row.lesson_id] = true;
  }

  res.json(result);
});


app.post("/api/lesson-complete", (req, res) => {
  const userId = req.cookies.course_user;
  const { moduleId, lessonId } = req.body;

  if (!userId || !moduleId || !lessonId) {
    return res.status(400).json({ ok: false });
  }

  db.prepare(`
    INSERT OR IGNORE INTO progress (user_id, module_id, lesson_id)
    VALUES (?, ?, ?)
  `).run(userId, moduleId, lessonId);

  res.json({ ok: true });
});


// ===== VOCABULARY =====

// pobierz statusy fiszek dla modułu
app.get("/api/vocab/status", (req, res) => {
  const userId = req.cookies.course_user;
  const moduleId = req.query.moduleId;

  if (!userId) {
    return res.status(401).json({ error: "No user" });
  }

  if (!moduleId) {
    return res.status(400).json({ error: "No moduleId" });
  }

 const rows = db.prepare(`
  SELECT word_id, status
  FROM vocabulary_progress
  WHERE user_id = ? AND module_id = ?
`).all(userId, moduleId);


  const statuses = {};
  for (const row of rows) {
    statuses[row.word_id] = row.status;
  }

  res.json({
    ok: true,
    statuses
  });
});
// zapisz odpowiedź użytkownika dla fiszki
app.post("/api/vocab/answer", (req, res) => {
  const userId = req.cookies.course_user;
  const { moduleId, wordId, status } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "No user" });
  }

  if (!moduleId || !wordId || !status) {
    return res.status(400).json({ error: "Missing data" });
  }

  if (!["known", "learning"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.prepare(`
    INSERT INTO vocabulary_progress
      (user_id, module_id, word_id, status, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, module_id, word_id)
    DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run(
    userId,
    moduleId,
    wordId,
    status,
    Date.now()
  );

  res.json({ ok: true });
});
// reset postępów fiszek dla modułu
app.post("/api/vocab/reset", (req, res) => {
  const userId = req.cookies.course_user;
  const { moduleId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "No user" });
  }

  if (!moduleId) {
    return res.status(400).json({ error: "No moduleId" });
  }


  db.prepare(`
    DELETE FROM vocabulary_progress
    WHERE user_id = ? AND module_id = ?
  `).run(userId, moduleId);

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
/*
app.post("/api/feedback", (req, res) => {
  const userId = req.userId;
  const dir = req.body?.dir;

  if (!userId) return res.status(401).json({ error: "No user" });

  let level = userStateStore[userId]?.level;
  if (!level) return res.status(400).json({ error: "Level not set" });

  if (dir === "harder") level = Math.min(5, level + 1);
  if (dir === "easier") level = Math.max(1, level - 1);

  userStateStore[userId].level = level;

  res.json({
    ok: true,
    level,
    moduleId: modulesByLevel[level]
  });
});
*/
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
        {
          role: "system",
          content: "Translate English words to Polish. Return only translation."
        },
        {
          role: "user",
          content: `Translate "${word}" in:\n${sentence || ""}`
        }
      ],
      temperature: 0.2
    });

    res.json({
      translation: completion.choices[0].message.content.trim()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translate failed" });
  }
});

// ===== CHAT (OPENAI) =====
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (err) {
    console.error("CHAT failed:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// ===== TTS (OPENAI) =====
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, instructions } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const mp3 = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice || "coral",
      input: text,
      instructions: instructions || undefined
      // domyślnie zwraca mp3
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err) {
    console.error("TTS failed:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});



// ===== WHISPER (OPENAI) =====
app.post("/api/whisper", async (req, res) => {
  try {
    const chunks = [];

    req.on("data", chunk => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      if (!buffer.length) {
        return res.status(400).json({ error: "No audio" });
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await client.audio.transcriptions.create({
        file: new File([buffer], "audio.webm", { type: "audio/webm" }),
        model: "whisper-1",
        language: "en"
      });

      res.json({ text: response.text });
    });
  } catch (err) {
    console.error("Whisper failed:", err);
    res.status(500).json({ error: "Whisper failed" });
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
const ALLOWED_PUBLIGO_PRODUCT_ID = "21686";

app.post("/api/publigo-webhook", async (req, res) => {
  console.log("📩 PUBLIGO WEBHOOK");

  // ✅ produkt (żeby widzieć, co kupiono)
  const productId =
    req.body?.product?.id ||
    req.body?.product_id ||
    null;

  console.log("🧾 productId:", productId);

  // ⛔️ ignorujemy inne produkty
if (productId !== ALLOWED_PUBLIGO_PRODUCT_ID) {
  console.log("⛔️ Produkt nieobsługiwany – pomijam wysyłkę maila");
  return res.status(200).json({ ok: true });
}


  // ✅ email (żeby wiedzieć, na co ma iść link)
  const email =
    req.body?.customer?.email ||
    req.body?.email ||
    null;

  console.log("📧 email:", email);

  if (!email) {
    console.log("❌ Brak email w webhooku");
    return res.status(200).json({ ok: false });
  }

  // 1️⃣ znajdź lub utwórz użytkownika
  let user = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);

  if (!user) {
    const id = "u_" + crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email)
      VALUES (?, ?)
    `).run(id, email);
    user = { id };
  }

  console.log("👤 userId:", user.id);
  return res.status(200).json({ ok: true });
});


// ===== STATIC =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

// ===== FRONTEND =====
app.get("/course", (req, res) => {
  const cookieUserId = req.cookies.course_user || null;

  // 1️⃣ jeśli user jest zapamiętany → wpuszczamy
  if (cookieUserId) {
    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(cookieUserId);

    if (user) {
      return res.sendFile(
        path.join(__dirname, "public", "course.html")
      );
    }
  }

  // 2️⃣ jeśli nie → frontend pokaże ekran z polem email
  return res.sendFile(
    path.join(__dirname, "public", "login.html")
  );
});














