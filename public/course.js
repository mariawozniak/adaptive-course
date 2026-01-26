import { modules } from "../data/modules.js";

const app = document.getElementById("app");

let currentModule = modules[0];
let moduleStarted = false;
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;
let finalFeedbackShown = false;

/* ===============================
   API
=============================== */
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

/* ===============================
   PROGRESS HELPERS
=============================== */
function isCompleted(lessonId) {
  if (!lessonId) return false;
  return Boolean(
    progress?.[currentModule.id]?.completedLessons?.[lessonId]
  );
}

function getLessonId(item) {
  if (!item) return null;
  return item.lessonId || item.id || null;
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

/* ===============================
   UI HELPERS
=============================== */
function shouldRenderCheckbox(item) {
  return item?.completion === "manual";
}

function renderCompleteButton(item) {
  if (!shouldRenderCheckbox(item)) return "";

  const lessonId = getLessonId(item);
  if (!lessonId) return "";

  const done = isCompleted(lessonId);

  return `
    <div class="lesson-complete">
      <button
        class="complete-btn ${done ? "done" : ""}"
        onclick="markCompleted('${lessonId}')"
      >
        <span class="complete-check"></span>
        <span class="complete-label">
          ${done ? "Ukończone" : "Oznacz jako ukończone"}
        </span>
      </button>
    </div>
  `;
}

function renderFinalFeedback() {
  if (!moduleStarted || !isModuleCompleted() || finalFeedbackShown) return "";

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

function renderBackButton() {
  if (activeVariant || activeActivity) {
    return `
      <button class="btn-back" onclick="goBack()">
        ← Wróć
      </button>
    `;
  }
  return "";
}

window.goBack = () => {
  if (activeVariant) activeVariant = null;
  else if (activeActivity) activeActivity = null;
  render();
};

/* ===============================
   RENDER
=============================== */
function render() {
  if (!currentLevel) {
    app.innerHTML = renderContent();
    return;
  }

  app.innerHTML = `
    <div id="content">
      <div class="module-inner">

        ${!moduleStarted ? "" : `<h1>${currentModule.title}</h1>`}

        ${
          moduleStarted && !activeActivity
            ? `
              <div class="activities-list">
                ${currentModule.activities.map(act => `
                  <div
                    class="activity-item"
                    onclick="openActivity('${act.id}')"
                  >
                    <span class="activity-status ${
                      isActivityCompleted(act) ? "done" : ""
                    }"></span>
                    <span class="activity-label">${act.label}</span>
                  </div>
                `).join("")}
              </div>
            `
            : ""
        }

        ${renderBackButton()}
        ${renderContent()}
        ${renderFinalFeedback()}

      </div>
    </div>
  `;
}

/* ===============================
   NAVIGATION
=============================== */
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

/* ===============================
   CONTENT
=============================== */
function renderContent() {
  if (!currentLevel) {
    return `
      <div class="level-page">
        <h1>Z jakiego poziomu startujemy?</h1>
        <div class="level-list">
          ${[1,2,3,4,5].map(l => `
            <button onclick="chooseLevel(${l})">Poziom ${l}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (!moduleStarted) {
    return `
      <div class="module-hero">
        <img src="/assets/covers/${currentModule.id}.jpg" />
        <h2>${currentModule.title}</h2>
        <button onclick="startModule()">Rozpocznij moduł</button>
      </div>
    `;
  }

  if (activeActivity?.variants?.length && !activeVariant) {
    return `
      <div class="activities-list">
        ${activeActivity.variants.map(v => `
          <div class="activity-item" onclick="openVariant('${v.id}')">
            <span class="activity-status ${
              isCompleted(v.id) ? "done" : ""
            }"></span>
            <span class="activity-label">${v.label}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  const item = activeVariant || activeActivity;
  if (!item) return "";

  if (item.type === "iframe") {
    return `
      <iframe
        src="${item.src}"
        width="100%"
        height="800"
        style="border:0;"
      ></iframe>
      ${renderCompleteButton(item)}
    `;
  }

  if (item.type === "audio") {
    return `
      <audio controls src="${item.src}"></audio>
      ${renderCompleteButton(item)}
    `;
  }

  if (item.type === "pdf") {
    return `
      <iframe
        src="${item.src}"
        width="100%"
        height="800"
        style="border:0;"
      ></iframe>
      ${renderCompleteButton(item)}
    `;
  }

  return "";
}

/* ===============================
   ACTIONS
=============================== */
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
  activeActivity = null;
  activeVariant = null;
  finalFeedbackShown = false;
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

window.sendFinalFeedback = window.sendFeedback = async (dir) => {
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

/* ===============================
   INIT
=============================== */
async function init() {
  await ensureUser();
  await loadProgress();
  await loadState();
  render();
}

init();
