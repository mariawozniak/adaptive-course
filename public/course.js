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
      <div class="${moduleStarted && (activeActivity || activeVariant) ? "" : "module-inner"}">
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

function renderLessonHeader(item) {
  if (!item) return "";

  const parts = [
    currentModule.title,
    activeActivity?.label
  ];

  if (activeVariant) {
    const index = activeActivity.variants.findIndex(
      v => v.id === activeVariant.id
    );
    parts.push(`Ćwiczenie ${index + 1}`);
  }

  return `
    <div class="lesson-header">
      <div class="lesson-header-inner">

        <button class="lesson-back-btn" onclick="goBack()">
          ← Wróć
        </button>

        <div class="lesson-breadcrumbs">
          ${parts.join(" → ")}
        </div>

        ${shouldRenderCheckbox(item) ? `
<label class="lesson-checkbox">
  <input
    type="checkbox"
    ${isCompleted(getLessonId(item)) ? "checked" : ""}
    onchange="markCompleted('${getLessonId(item)}')"
  />
  <span class="lesson-checkmark"></span>
  <span class="lesson-check-label">Oznacz jako ukończone</span>
</label>

        ` : ""}

      </div>
    </div>
  `;
}

function renderListHeader(title) {
  return `
    <div class="lesson-header">
      <div class="lesson-header-inner">

        <button class="lesson-back-btn" onclick="goBack()">
          ← Wróć
        </button>

        <div class="lesson-breadcrumbs">
          ${title}
        </div>

      </div>
    </div>
  `;
}



// ===============================
// CONTENT
// ===============================
function renderContent() {
 if (!currentLevel) {
  return `
    <div class="level-page">
      <h1 class="level-title">Z jakiego poziomu startujemy?</h1>

      <div class="level-list">
        <button class="level-item" onclick="chooseLevel(1)">
          <span class="level-code">A0</span>
          <span class="level-desc">Zaczynam od zera</span>
        </button>

        <button class="level-item" onclick="chooseLevel(2)">
          <span class="level-code">A1</span>
          <span class="level-desc">Znam absolutne podstawy</span>
        </button>

        <button class="level-item" onclick="chooseLevel(3)">
          <span class="level-code">A2</span>
          <span class="level-desc">Umiem dogadać się w prostych sytuacjach</span>
        </button>

        <button class="level-item" onclick="chooseLevel(4)">
          <span class="level-code">B1</span>
          <span class="level-desc">Mówię, ale chcę lepiej</span>
        </button>

        <button class="level-item" onclick="chooseLevel(5)">
          <span class="level-code">B2</span>
          <span class="level-desc">Mówię dość swobodnie</span>
        </button>
      </div>
    </div>
  `;
}


if (!moduleStarted) {
  return `
    <div class="module-hero">
      <div class="module-card">
        <img
          src="/assets/covers/${currentModule.id}.jpg"
          alt="${currentModule.title}"
          class="module-cover"
        />

        <h2 class="module-title">${currentModule.title}</h2>

        <button class="btn-primary" onclick="startModule()">
          Rozpocznij moduł
        </button>
      </div>
    </div>
  `;
}

  if (moduleStarted && !activeActivity) {
  return `
<h1 class="page-title">${currentModule.title}</h1>

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
  `;
}


// ===============================
// VARIANTS LIST (PO KLIKNIĘCIU AKTYWNOŚCI)
// ===============================
// ===== VARIANTS (ALE NIE VOCABULARY) =====
if (
  activeActivity &&
  activeActivity.variants?.length &&
  !activeVariant &&
  activeActivity.id !== "vocabulary"
) {
  return `
    ${renderListHeader(activeActivity.label)}

    <div class="activities-list">
      ${activeActivity.variants.map((v, index) => `
        <div
          class="activity-item"
          onclick="openVariant('${v.id}')"
        >
          <span class="activity-status ${isCompleted(v.id) ? "done" : ""}"></span>
          <span class="activity-label">
            ${getVariantDisplayName(activeActivity, index)}
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

// ===== VOCABULARY – STARY WIDOK (SPECJALNY) =====
if (
  activeActivity &&
  activeActivity.id === "vocabulary" &&
  activeActivity.variants?.length &&
  !activeVariant
) {
  return `
    ${renderListHeader(activeActivity.label)}

    <h2 class="page-subtitle">Jak wolisz się uczyć?</h2>

    <div class="activities-list">
      ${activeActivity.variants.map(v => `
        <div
          class="activity-item"
          onclick="openVariant('${v.id}')"
        >
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

  // 👉 PRZEJŚCIE DO SHADOWINGU (OSOBNA APLIKACJA)
if (item.type === "internal" && item.engine === "shadowing") {
  window.location.href =
    `/shadowing/index.html?module=${currentModule.id}`;
  return "";
}


if (item.type === "iframe")
  return `
    ${renderLessonHeader(item)}
    <iframe src="${item.src}" width="100%" height="800"></iframe>
  `;


if (item.type === "audio")
  return `
    ${renderLessonHeader(item)}
    <audio controls src="${item.src}"></audio>
  `;

if (item.type === "pdf")
  return `
    ${renderLessonHeader(item)}
    <iframe src="${item.src}" width="100%" height="800"></iframe>
  `;

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
  activeActivity = null;   // ← KLUCZ
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
