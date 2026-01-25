console.log("🔥 SERVER.JS STARTED 🔥");
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";

const app = express();
app.use(express.json());

app.get("/api/debug-key", (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  res.json({
    hasKey: Boolean(key),
    keyLength: key ? key.length : 0,
    keyPrefix: key ? key.slice(0, 3) : null,
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.toLowerCase().includes("openai")
    )
  });
});


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

// ===== SETUP =====
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== IN-MEMORY STORES =====
const progressStore = {};
const userStateStore = {};

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
  let userId = req.cookies.course_user;

  if (!userId) {
    userId = "u_" + crypto.randomUUID();
    res.setHeader(
      "Set-Cookie",
      `course_user=${userId}; Path=/; HttpOnly; SameSite=Lax`
    );
  }

  res.json({ userId });
});

// ===== STATE =====
const userStateStore = {};
const progressStore = {};

app.get("/api/state", (req, res) => {
  const userId = req.cookies.course_user;
  res.json({ level: userStateStore[userId]?.level ?? null });
});

app.post("/api/level", (req, res) => {
  const userId = req.cookies.course_user;
  const level = Number(req.body?.level);

  if (!userId || !level) {
    return res.status(400).json({ error: "bad request" });
  }

  userStateStore[userId] = { level };
  res.json({ ok: true, level });
});

app.get("/api/progress", (req, res) => {
  const userId = req.cookies.course_user;
  res.json(progressStore[userId] || {});
});

app.post("/api/lesson-complete", (req, res) => {
  const { moduleId, lessonId } = req.body;
  const userId = req.cookies.course_user;

  progressStore[userId] ??= {};
  progressStore[userId][moduleId] ??= { completedLessons: {} };
  progressStore[userId][moduleId].completedLessons[lessonId] = true;

  res.json({ ok: true });
});

app.post("/api/feedback", (req, res) => {
  res.json({ ok: true, level: 1, moduleId: "module_1" });
});


// ===== STATE =====
app.get("/api/state", (req, res) => {
  const userId = req.cookies.course_user;
  res.json({ level: userId ? userStateStore[userId]?.level ?? null : null });
});

app.post("/api/level", (req, res) => {
  const userId = req.cookies.course_user;
  const level = Number(req.body?.level);

  if (!userId) return res.status(401).json({ error: "No user" });
  if (![1,2,3,4,5].includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }

  userStateStore[userId] ??= {};
  userStateStore[userId].level = level;

  res.json({ ok: true, level });
});

// ===== PROGRESS =====
app.get("/api/progress", (req, res) => {
  const userId = req.cookies.course_user;
  res.json(userId ? progressStore[userId] || {} : {});
});

app.post("/api/lesson-complete", (req, res) => {
  const userId = req.cookies.course_user;
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
  const userId = req.cookies.course_user;
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





