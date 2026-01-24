import { modules } from "../data/modules.js";

const app = document.getElementById("app");

let currentModule = modules[0];
let moduleStarted = false;
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;
let finalFeedbackShown = false;

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

function isModuleCompleted() {
  return currentModule.activities
    .filter(a => a.required)
    .every(a => isActivityCompleted(a));
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

function renderFinalFeedback() {
  if (!moduleStarted) return "";
  if (!isModuleCompleted()) return "";
  if (finalFeedbackShown) return "";

  return `
    <div style="
      margin-top:32px;
      padding:20px;
      border:2px solid #ddd;
      border-radius:16px;
      background:#fafafa;
      text-align:center;
    ">
      <h3>🎉 Ukończyłaś moduł!</h3>
      <p>Jak było?</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button onclick="sendFinalFeedback('easier')">🔻 Za trudne</button>
        <button onclick="sendFinalFeedback('ok')">✅ OK</button>
        <button onclick="sendFinalFeedback('harder')">🔺 Za łatwe</button>
      </div>
    </div>
  `;
}

// ===============================
// RENDER
// ===============================
function render() {
  if (!currentLevel) {
    app.innerHTML = `<div>${renderContent()}</div>`;
    return;
  }

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
      ${renderFinalFeedback()}
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
  if (!currentLevel) {
    return `
      <h2>Wybierz poziom startowy</h2>
      <div style="display:flex;gap:10px;">
        ${[1,2,3,4,5].map(l => `<button onclick="chooseLevel(${l})">Poziom ${l}</button>`).join("")}
      </div>
    `;
  }

  if (!moduleStarted) {
    return `
      <div style="text-align:center;margin-top:40px;">
        <img src="/assets/covers/${currentModule.id}.jpg" style="max-width:320px;border-radius:16px;" />
        <h2>${currentModule.title}</h2>
        <button onclick="startModule()">▶ Rozpocznij</button>
      </div>
    `;
  }

  if (activeActivity?.variants?.length && !activeVariant) {
    return `
      <h3>${activeActivity.label}</h3>
      <ul>
        ${activeActivity.variants.map(v => `
          <li>
            <button onclick="openVariant('${v.id}')">
              ${isCompleted(v.id) ? "☑" : "☐"} ${v.label}
            </button>
          </li>
        `).join("")}
      </ul>
    `;
  }

  const item = activeVariant || activeActivity;
  if (!item) return "";

  if (item.type === "iframe") return `<iframe src="${item.src}" width="100%" height="800"></iframe>${renderCompleteButton(item)}`;
  if (item.type === "audio") return `<audio controls src="${item.src}"></audio>${renderCompleteButton(item)}`;
  if (item.type === "pdf") return `<iframe src="${item.src}" width="100%" height="800"></iframe>${renderCompleteButton(item)}`;
  if (item.type === "internal") return `<p>🛠 ${item.label}</p>`;

  return "";
}

// ===============================
// ACTIONS
// ===============================
window.markCompleted = async (lessonId) => {
  await fetch("/api/lesson-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ moduleId: currentModule.id, lessonId })
  });

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
  await saveLevel(lvl);
  moduleStarted = false;
  activeActivity = null;
  activeVariant = null;
  finalFeedbackShown = false;
  render();
};

window.sendFeedback = async (dir) => {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dir })
  });

  const data = await res.json();
  currentLevel = data.level;

  const next = modules.find(m => m.id === data.moduleId);
  if (next) currentModule = next;

  moduleStarted = false;
  activeActivity = null;
  activeVariant = null;
  progress = {};
  finalFeedbackShown = false;

  render();
};

window.sendFinalFeedback = window.sendFeedback;

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
