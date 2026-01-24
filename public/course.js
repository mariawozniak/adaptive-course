import { modules } from "../data/modules.js";

const app = document.getElementById("app");

let currentModule = modules[0];
let moduleStarted = false;
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;

// ===============================
// API
// ===============================
async function ensureUser() {
  await fetch("/api/me", { credentials: "include" });
}

async function loadProgress() {
  try {
    const res = await fetch("/api/progress", { credentials: "include" });
    progress = await res.json();
  } catch {
    progress = {};
  }
}

async function loadState() {
  try {
    const res = await fetch("/api/state", { credentials: "include" });
    const data = await res.json();
    currentLevel = data?.level ?? null;
  } catch {
    currentLevel = null;
  }
}

async function saveLevel(level) {
  const res = await fetch("/api/level", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ level })
  });

  if (!res.ok) throw new Error("level save failed");
  const data = await res.json();
  currentLevel = data.level;
}

// ===============================
// PROGRESS HELPERS
// ===============================
function isCompleted(lessonId) {
  if (!lessonId) return false;
  return Boolean(
    progress?.[currentModule.id]?.completedLessons?.[lessonId]
  );
}

function getLessonId(item) {
  if (!item) return null;
  if (item.id && !item.lessonId) return item.id;
  if (item.lessonId) return item.lessonId;
  return null;
}

function isActivityCompleted(activity) {
  if (!activity) return false;

  if (activity.variants?.length) {
    if (activity.completionRule === "any") {
      return activity.variants.some(v => isCompleted(v.id));
    }
    return activity.variants.every(v => isCompleted(v.id));
  }

  if (activity.lessonId) {
    return isCompleted(activity.lessonId);
  }

  return false;
}

// ===============================
// UI HELPERS
// ===============================
function renderCompleteButton(item) {
  const lessonId = getLessonId(item);
  if (!lessonId) return "";
  if (item.type === "internal") return "";

  return `
    <button onclick="markCompleted('${lessonId}')">
      ${isCompleted(lessonId) ? "☑" : "☐"} Oznacz jako ukończone
    </button>
  `;
}

function renderLiveFeedbackBar() {
  if (!currentLevel || !moduleStarted) return "";

  return `
    <div style="
      margin-top:32px;
      padding:16px;
      border-top:1px solid #ddd;
      display:flex;
      gap:16px;
      justify-content:center;
    ">
      <button onclick="sendFeedback('easier')">🔻 Za trudne</button>
      <button onclick="sendFeedback('harder')">🔺 Za łatwe</button>
    </div>
  `;
}

// ===============================
// RENDER
// ===============================
function render() {
  // ⬅️ TYLKO WYBÓR POZIOMU
  if (!currentLevel) {
    app.innerHTML = `
      <div id="content">
        ${renderContent()}
      </div>
    `;
    return;
  }

  // ⬅️ PEŁNY KURS
  app.innerHTML = `
    <h1>${currentModule.title}</h1>

    <div style="margin-bottom:16px;">
      ${currentModule.activities
        .map(
          act => `
            <button onclick="openActivity('${act.id}')">
              ${isActivityCompleted(act) ? "☑" : "☐"} ${act.label}
            </button>
          `
        )
        .join("")}
    </div>

    <div id="content">
      ${renderContent()}
      ${renderLiveFeedbackBar()}
    </div>
  `;
}

// ===============================
// NAVIGATION
// ===============================
window.openActivity = (activityId) => {
  moduleStarted = true;
  activeActivity = currentModule.activities.find(a => a.id === activityId);
  activeVariant = null;
  render();
};

window.openVariant = (variantId) => {
  activeVariant = activeActivity.variants.find(v => v.id === variantId);
  render();
};

// ===============================
// CONTENT
// ===============================
function renderContent() {
  // 1️⃣ WYBÓR POZIOMU
  if (!currentLevel) {
    return `
      <h2>Wybierz poziom startowy</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${[1,2,3,4,5]
          .map(lvl => `<button onclick="chooseLevel(${lvl})">Poziom ${lvl}</button>`)
          .join("")}
      </div>
    `;
  }

  // 2️⃣ EKRAN STARTOWY MODUŁU
  if (!moduleStarted) {
    return `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:60vh;
        text-align:center;
        gap:20px;
      ">
        <img
          src="/assets/covers/${currentModule.id}.jpg"
          alt="${currentModule.title}"
          style="max-width:320px;border-radius:16px;"
        />
        <h2>${currentModule.title}</h2>
        <button
          style="padding:14px 28px;font-size:18px;font-weight:600;"
          onclick="startModule()"
        >
          ▶ Rozpocznij
        </button>
      </div>
    `;
  }

  // 3️⃣ LISTA WARIANTÓW
  if (activeActivity?.variants?.length && !activeVariant) {
    return `
      <h3>${activeActivity.label}</h3>
      <ul>
        ${activeActivity.variants
          .map(
            v => `
              <li>
                <button onclick="openVariant('${v.id}')">
                  ${isCompleted(v.id) ? "☑" : "☐"} ${v.label}
                </button>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  const item = activeVariant || activeActivity;
  if (!item) return "";

  if (item.type === "iframe") {
    return `<iframe src="${item.src}" width="100%" height="800"></iframe>
            ${renderCompleteButton(item)}`;
  }

  if (item.type === "audio") {
    return `<audio controls src="${item.src}"></audio>
            ${renderCompleteButton(item)}`;
  }

  if (item.type === "pdf") {
    return `<iframe src="${item.src}" width="100%" height="800"></iframe>
            ${renderCompleteButton(item)}`;
  }

  if (item.type === "internal") {
    return `<p>🛠 ${item.label}</p>`;
  }

  return `<p>Nieznany typ treści</p>`;
}

// ===============================
// ACTIONS
// ===============================
window.markCompleted = async (lessonId) => {
  const res = await fetch("/api/lesson-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      moduleId: currentModule.id,
      lessonId
    })
  });

  if (!res.ok) {
    alert("Błąd zapisu postępu");
    return;
  }

  await loadProgress();
  render();
};

window.startModule = () => {
  moduleStarted = true;
  activeActivity = currentModule.activities[0];
  activeVariant = null;
  render();
};

window.chooseLevel = async (lvl) => {
  try {
    await saveLevel(lvl);
    moduleStarted = false;
    activeActivity = null;
    activeVariant = null;
    render();
  } catch {
    alert("Nie udało się zapisać poziomu");
  }
};

window.sendFeedback = async (dir) => {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dir })
  });

  if (!res.ok) {
    alert("Nie udało się zmienić poziomu");
    return;
  }

  const data = await res.json();
  currentLevel = data.level;

  const next = modules.find(m => m.id === data.moduleId);
  if (next) currentModule = next;

  moduleStarted = false;
  activeActivity = null;
  activeVariant = null;
  progress = {};

  render();
};

// ===============================
// INIT
// ===============================
async function init() {
  await ensureUser();
  await loadProgress();
  await loadState();
  render();
}

init();
