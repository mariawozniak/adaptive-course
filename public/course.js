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
  if (activeVariant) {
    activeVariant = null;
  } else if (activeActivity) {
    activeActivity = null;
  }
  render();
};

// ===============================
// RENDER
// ===============================
function render() {
  if (!currentLevel) {
    app.innerHTML = renderContent();
    return;
  }

  app.innerHTML = `
    <div id="content">
      <div class="module-inner">

        ${!moduleStarted ? "" : `
          <h1 style="margin-bottom:24px;">
            ${currentModule.title}
          </h1>
        `}

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

  // ⬇️⬇️⬇️ TO JEST TO „OSTATNIE” ⬇️⬇️⬇️
  const item = activeVariant || activeActivity;
  if (item?.type === "iframe") {
    loadLessonHTML(item.src);
  }
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

  // ===============================
  // LEVEL SELECT
  // ===============================
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

  // ===============================
  // MODULE HERO
  // ===============================
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

  // ===============================
  // VARIANTS SELECT
  // ===============================
  if (activeActivity && activeActivity.variants?.length && !activeVariant) {
    return `
      <div class="activities-list">
        ${activeActivity.variants.map(variant => `
          <div
            class="activity-item"
            onclick="openVariant('${variant.id}')"
          >
            <span class="activity-status ${
              isCompleted(variant.id) ? "done" : ""
            }"></span>
            <span class="activity-label">${variant.label}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  // ===============================
  // ACTUAL LESSON
  // ===============================
  const item = activeVariant || activeActivity;
  if (!item) return "";

if (item.type === "iframe") {
  return `
    <div class="lesson-wrap">
      <div id="lesson-root"></div>
      ${renderCompleteButton(item)}
    </div>
  `;
}



if (item.type === "audio") {
  return `
    <div class="lesson-wrap">
      <audio controls src="${item.src}"></audio>
      ${renderCompleteButton(item)}
    </div>
  `;
}


if (item.type === "pdf") {
  return `
    <div class="lesson-wrap">
      <iframe src="${item.src}"></iframe>
      ${renderCompleteButton(item)}
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
    body: JSON.stringify({ moduleId: currentModule.id, lessonId })
  });

  await loadProgress();
  render();
};

window.startModule = () => {
  moduleStarted = true;
  activeActivity = null;   // <-- klucz: po starcie NIE wybieramy aktywności
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

async function loadLessonHTML(src) {
  const res = await fetch(src);
  const html = await res.text();

  const root = document.getElementById("lesson-root");
  if (!root) return;

  // 1️⃣ wyczyść starą lekcję
  root.innerHTML = "";

  // 2️⃣ stwórz tymczasowy kontener
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // 3️⃣ przenieś HTML (bez scriptów)
  [...tmp.children].forEach(el => {
    if (el.tagName !== "SCRIPT") {
      root.appendChild(el);
    }
  });

  // 4️⃣ ręcznie odpal scripty
  const scripts = tmp.querySelectorAll("script");
  for (const oldScript of scripts) {
    const s = document.createElement("script");

    if (oldScript.src) {
      s.src = oldScript.src;
    } else {
      s.textContent = oldScript.textContent;
    }

    document.body.appendChild(s);
  }
}



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
