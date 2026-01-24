import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";

const app = express();
app.use(express.json());

// ===== COOKIES (TWÓJ MECHANIZM – ZOSTAJE) =====
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
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== IN-MEMORY STORES =====
const progressStore = {};   // { userId: { moduleId: { completedLessons } } }
const userStateStore = {};  // { userId: { level } }

// ===== API =====

// --- HEALTH ---
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend działa ✅",
    time: new Date().toISOString()
  });
});

// --- MODULES (CONFIG) ---
app.get("/api/modules", (req, res) => {
  res.json(modules);
});

// --- USER / COOKIE ---
app.get("/api/me", (req, res) => {
  let userId = req.cookies.course_user;

  if (!userId) {
    userId = "u_" + crypto.randomUUID();
    res.setHeader(
      "Set-Cookie",
      `course_user=${userId}; Path=/; HttpOnly; SameSite=None; Secure`
    );
  }

  res.json({ userId });
});

// ===== PROGRESS =====
app.get("/api/progress", (req, res) => {
  const userId = req.cookies.course_user;
  if (!userId) return res.json({});
  res.json(progressStore[userId] || {});
});

app.post("/api/lesson-complete", (req, res) => {
  const { moduleId, lessonId } = req.body;
  const userId = req.cookies.course_user;

  if (!userId || !moduleId || !lessonId) {
    return res.status(400).json({ ok: false });
  }

  progressStore[userId] ??= {};
  progressStore[userId][moduleId] ??= { completedLessons: {} };
  progressStore[userId][moduleId].completedLessons[lessonId] = true;

  res.json({ ok: true });
});

// ===== LEVEL / STATE =====
app.get("/api/state", (req, res) => {
  const userId = req.cookies.course_user;
  const level = userId ? userStateStore[userId]?.level : null;
  res.json({ level: level ?? null });
});

app.post("/api/level", (req, res) => {
  const userId = req.cookies.course_user;
  const level = Number(req.body?.level);

  if (!userId) return res.status(401).json({ error: "No user" });
  if (![1, 2, 3, 4, 5].includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }

  userStateStore[userId] ??= {};
  userStateStore[userId].level = level;

  res.json({ ok: true, level });
});

// ===== NEXT MODULE LOGIC (MVP) =====

// tymczasowa mapa: każdy level → module_1
// później zamienisz to na realną logikę
const modulesByLevel = {
  1: "module_1",
  2: "module_1",
  3: "module_1",
  4: "module_1",
  5: "module_1"
};

app.get("/api/next", (req, res) => {
  const userId = req.cookies.course_user;
  if (!userId) return res.status(401).json({ error: "No user" });

  const level = userStateStore[userId]?.level;
  if (!level) return res.status(400).json({ error: "Level not set" });

  const moduleId = modulesByLevel[level] || "module_1";
  res.json({ moduleId, level });
});

// ===== FEEDBACK =====
app.post("/api/feedback", (req, res) => {
  const userId = req.cookies.course_user;
  if (!userId) return res.status(401).json({ error: "No user" });

  const dir = req.body?.dir; // "easier" | "ok" | "harder"
  let level = userStateStore[userId]?.level;
  if (!level) return res.status(400).json({ error: "Level not set" });

  if (dir === "harder") level = Math.min(5, level + 1);
  if (dir === "easier") level = Math.max(1, level - 1);
  // "ok" → bez zmian

  userStateStore[userId].level = level;

  const moduleId = modulesByLevel[level] || "module_1";
  res.json({ ok: true, level, moduleId });
});

// ===== RESET (DEV) =====
app.get("/api/reset", (req, res) => {
  for (const u in progressStore) delete progressStore[u];
  for (const u in userStateStore) delete userStateStore[u];
  res.json({ ok: true });
});

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

// ===== FRONTEND ENTRYPOINT =====
// ⚠️ UWAGA: TYLKO /course → frontend kursu
app.get("/course", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "course.html"));
});

// ❌ NIE MA app.get("*")

// ===== START =====
app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
