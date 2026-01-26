console.log("🔥 SERVER.JS STARTED 🔥");

import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { modules } from "./data/modules.js";
import { createClient } from "@supabase/supabase-js";

// ===== SUPABASE =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ===== APP =====
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

// ===== USER IDENTIFICATION =====
app.use((req, res, next) => {
  if (req.cookies.course_user) {
    req.userId = req.cookies.course_user;
    return next();
  }

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

  req.userId = null;
  next();
});

// ===== SETUP =====
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== IN-MEMORY PROGRESS =====
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
app.get("/api/state", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.json({});

  const { data } = await supabase
    .from("user_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return res.json({});

  res.json({
    level: data.level,
    currentModuleId: data.current_module,
    moduleCompleted: Boolean(data.module_completed),
    lastActivity: data.last_activity
  });
});

// ===== LEVEL =====
app.post("/api/level", async (req, res) => {
  const userId = req.userId;
  const level = Number(req.body?.level);

  if (!userId) return res.status(401).json({ error: "No user" });
  if (![1, 2, 3, 4, 5].includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }

  await supabase.from("user_state").upsert({
    user_id: userId,
    level,
    current_module: null,
    module_completed: false,
    last_activity: null
  });

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

app.post("/api/feedback", async (req, res) => {
  const userId = req.userId;
  const dir = req.body?.dir;

  if (!userId) return res.status(401).json({ error: "No user" });

  const { data } = await supabase
    .from("user_state")
    .select("level")
    .eq("user_id", userId)
    .single();

  if (!data?.level)
    return res.status(400).json({ error: "Level not set" });

  let level = data.level;
  if (dir === "harder") level = Math.min(5, level + 1);
  if (dir === "easier") level = Math.max(1, level - 1);

  await supabase
    .from("user_state")
    .update({ level })
    .eq("user_id", userId);

  res.json({
    ok: true,
    level,
    moduleId: modulesByLevel[level]
  });
});

// ===== LAST ACTIVITY =====
app.post("/api/last-activity", async (req, res) => {
  const userId = req.userId;
  const { moduleId, activityId, variantId } = req.body;

  if (!userId) return res.status(401).json({ error: "No user" });

  await supabase.from("user_state").upsert({
    user_id: userId,
    current_module: moduleId,
    last_activity: { activityId, variantId },
    module_completed: false
  });

  res.json({ ok: true });
});

// ===== MODULE COMPLETE =====
app.post("/api/module-complete", async (req, res) => {
  const userId = req.userId;
  const { moduleId } = req.body;

  if (!userId || !moduleId)
    return res.status(400).json({ error: "Missing data" });

  await supabase.from("user_state").upsert({
    user_id: userId,
    current_module: moduleId,
    module_completed: true
  });

  res.json({ ok: true });
});

// ===== TRANSLATE =====
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
