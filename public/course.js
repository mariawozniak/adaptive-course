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
  if (item.lessonId) return item.lessonId;
  if (item.id) return item.id;
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
function getVariantDisplayName(activity, index) {
  if (activity.id === "listening") {
    return `Ćwiczenie ${index + 1}`;
  }
  return activity.variants[index].label;
}

function shouldRenderCheckbox(item) {
  return item?.completion === "manual";
}

function renderCompleteButton(item) {
  if (!shouldRenderCheckbox(item)) return "";

  const lessonId = getLessonId(item);
  if (!lessonId) return "";

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
  app.innerHTML = `
    <div id="content">
      <div class="${
        moduleStarted && (activeActivity || activeVariant)
          ? ""
          : "module-inner"
      }">
        ${renderContent()}
        ${renderFinalFeedback()}
      </div>
    </div>
  `;
}

// ===============================
// NAVIGATION
// ===============================
window.goBack = () => {
  if (activeVariant) {
    activeVariant = null;
    render();
    return;
  }

  if (activeActivity) {
    activeActivity = null;
    render();
    return;
  }

  if (moduleStarted) {
    moduleStarted = false;
    render();
  }
};

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
      <div class="level-page">
        <h1 class="level-title">Z jakiego poziomu startujemy?</h1>
        <div class="level-list">
          <button onclick="chooseLevel(1)">A0</button>
          <button onclick="chooseLevel(2)">A1</button>
          <button onclick="chooseLevel(3)">A2</button>
          <button onclick="chooseLevel(4)">B1</button>
          <button onclick="chooseLevel(5)">B2</button>
        </div>
      </div>
    `;
  }

  if (!moduleStarted) {
    return `
      <h2>${currentModule.title}</h2>
      <button onclick="startModule()">Rozpocznij moduł</button>
    `;
  }

  if (!activeActivity) {
    return `
      <div>
        ${currentModule.activities.map(a => `
          <div onclick="openActivity('${a.id}')">
            ${a.label}
          </div>
        `).join("")}
      </div>
    `;
  }

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
    body: JSON.stringify({
      moduleId: currentModule.id,
      lessonId
    })
  });

  await loadProgress();
  render();
};

window.startModule = () => {
  moduleStarted = true;
  activeActivity = null;
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
