console.log("🔥 SERVER.JS STARTED 🔥");

import { db } from "./db.js";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";
import { Resend } from "resend";


const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

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
  const userId = req.cookies.course_user;

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

async function sendMagicLink(email, link) {
  await resend.emails.send({
    from: "Kurs <onboarding@resend.dev>",
    to: email,
    subject: "Dostęp do kursu",
    html: `
      <p>Cześć 👋</p>
      <p>Kliknij w link poniżej, aby wejść do kursu:</p>
      <p>
        <a href="${link}">👉 Otwórz kurs</a>
      </p>
      <p>
        Jeśli otwierasz kurs na nowym urządzeniu, ten link zaloguje Cię automatycznie.
      </p>
    `
  });
}

// ===== PUBLIGO WEBHOOK =====
/*

app.post("/api/publigo-webhook", (req, res) => {
  console.log("📩 PUBLIGO WEBHOOK RECEIVED");
  console.log(JSON.stringify(req.body, null, 2));

  const data = req.body;

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

  userStateStore[internalUserId] ??= {};
  userStateStore[internalUserId].email = email;
  userStateStore[internalUserId].productId = productId;

  console.log("✅ User mapped:", internalUserId);

  res.status(200).json({ ok: true });
});
*/

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


