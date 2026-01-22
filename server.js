import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";


const app = express();

// middleware do parsowania cookies (proste, bez biblioteki)
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

// Railway podaje port w zmiennej środowiskowej PORT
const PORT = process.env.PORT || 3000;

// Potrzebne w ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serwowanie plików frontendu z /public
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));


app.get("/api/modules", (req, res) => {
  res.json(modules);
});


// ✅ API: health
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend działa ✅",
    time: new Date().toISOString()
  });
});

// ✅ API: automatic user identification
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

// ⚠️ ZAWSZE NA SAMYM KOŃCU
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "course.html"));
});

// in-memory store (na teraz)
const progressStore = {};

// oznacz lekcję jako ukończoną
app.post("/api/lesson-complete", express.json(), (req, res) => {
  const { moduleId, lessonId } = req.body;
  const userId = req.cookies.course_user;

  if (!userId || !moduleId || !lessonId) {
    return res.status(400).json({ ok: false });
  }

  if (!progressStore[userId]) {
    progressStore[userId] = {};
  }

  if (!progressStore[userId][moduleId]) {
    progressStore[userId][moduleId] = { completedLessons: {} };
  }

  progressStore[userId][moduleId].completedLessons[lessonId] = true;

  res.json({ ok: true });
});

app.get("/api/reset", (req, res) => {
  for (const u in progressStore) {
    delete progressStore[u];
  }
  res.json({ ok: true });
});


app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});





