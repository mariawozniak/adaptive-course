import express from "express";
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

// ===== SETUP =====
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== IN-MEMORY STORE =====
const progressStore = {};

// ===== API =====

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend działa ✅", time: new Date().toISOString() });
});

app.get("/api/modules", (req, res) => {
  res.json(modules);
});

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

app.get("/api/progress", (req, res) => {
  const userId = req.cookies.course_user;
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

app.get("/api/reset", (req, res) => {
  for (const u in progressStore) delete progressStore[u];
  res.json({ ok: true });
});

// ===== STATIC (DOPIERO TERAZ) =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

// ===== FRONTEND CATCH-ALL (OSTATNIE) =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "course.html"));
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
