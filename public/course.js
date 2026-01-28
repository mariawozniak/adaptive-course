import { modules } from "../data/modules.js";

const app = document.getElementById("app");

let currentModule = modules[0];
let moduleStarted = false;
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;
let finalFeedbackShown = false;

// ===== LEVEL -> MODULE MAP (FRONTEND) =====
// USTAW TU, który moduł ma być otwierany dla danego poziomu.
// Na start możesz zostawić wszystko na module_1, potem zmienisz.

function getModulesForLevel(level) {
  return modules
    .filter(m => m.level === level)
    .sort((a, b) => a.id.localeCompare(b.id));
}


function isModuleFullyCompleted(module) {
  if (!module) return false;

  return module.activities
    .filter(a => a.required)
    .every(a => {
      if (a.variants?.length) {
        return a.variants.every(v =>
          progress?.[module.id]?.completedLessons?.[v.id]
        );
      }
      if (a.lessonId) {
        return progress?.[module.id]?.completedLessons?.[a.lessonId];
      }
      return true;
    });
}


function setModuleForLevel(level) {
  if (!level) {
    currentModule = modules[0];
    return;
  }

  const sameLevelModules = getModulesForLevel(level);

  if (!sameLevelModules.length) {
    currentModule = modules[0];
    return;
  }

  for (const m of sameLevelModules) {
    if (!isModuleFullyCompleted(m)) {
      currentModule = m;
      return;
    }
  }

  currentModule = sameLevelModules[0];
}





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

    if (currentLevel) {
      setModuleForLevel(currentLevel);
    }
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
  return "";
}


function renderFinalFeedback() {
  return "";
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

        <!-- ⬇⬇⬇ TO JEST TEN KROK 1.5 ⬇⬇⬇ -->
        <div class="lesson-difficulty">
          <button
            class="lesson-diff-btn"
            onclick="lessonFeedback('easier')"
          >
            Za trudne
          </button>

          <button
            class="lesson-diff-btn"
            onclick="lessonFeedback('harder')"
          >
            Za łatwe
          </button>
        </div>
        <!-- ⬆⬆⬆ KONIEC KROKU 1.5 ⬆⬆⬆ -->

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

  // 👉 AI LEKTOR (OSOBNA APLIKACJA)
if (item.type === "internal" && item.engine === "ai-voice") {
  window.location.href =
    `/ai-voice/index.html?module=${currentModule.id}`;
  return "";
}


  // 👉 VOCABULARY ENGINE (osobna aplikacja)
if (item.id === "vocabulary") {
  window.location.href =
    `/vocabulary/index.html?module=${currentModule.id}`;
  return "";
}


if (item.type === "iframe")
  return `
    ${renderLessonHeader(item)}

    <div class="lesson-iframe-wrapper">
      <iframe
        src="${item.src}"
        allowfullscreen
        loading="lazy"
        scrolling="no"
      ></iframe>
    </div>

    <div class="lesson-difficulty lesson-difficulty-mobile">
      <button
        class="lesson-diff-btn"
        onclick="lessonFeedback('easier')"
      >
        Za trudne
      </button>

      <button
        class="lesson-diff-btn"
        onclick="lessonFeedback('harder')"
      >
        Za łatwe
      </button>
    </div>
  `;


if (item.type === "audio")
  return `
    ${renderLessonHeader(item)}

    <div class="lesson-audio-wrapper">
<audio
  controls
  controlsList="nodownload"
  preload="metadata"
  src="${item.src}"
></audio>
    </div>
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
  setModuleForLevel(currentLevel);

  moduleStarted = false;
  activeActivity = null;
  activeVariant = null;
  finalFeedbackShown = false;

  window.scrollTo(0, 0);
  render();
};

window.lessonFeedback = async (dir) => {
  // dir: "easier" | "harder"
  const msg =
    "Teraz opuścisz moduł i zaproponuję Ci materiał bardziej odpowiedni dla Ciebie.";

  const ok = window.confirm(msg);
  if (!ok) return;

  if (!currentLevel) return;

  let newLevel = currentLevel;

  if (dir === "harder") newLevel = Math.min(5, currentLevel + 1);
  if (dir === "easier") newLevel = Math.max(1, currentLevel - 1);

  // jeśli i tak jesteśmy na granicy (1 albo 5), nic się nie zmieni — ale nadal ok:
  await saveLevel(newLevel);
  setModuleForLevel(currentLevel);

  // wyjście do ekranu modułu (hero)
  moduleStarted = false;
  activeActivity = null;
  activeVariant = null;
  finalFeedbackShown = false;

  window.scrollTo(0, 0);
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

// ===============================
// iframe auto-height — TYLKO shadowing
// ===============================
window.addEventListener("message", (e) => {
  if (
    e.data?.type !== "shadowing-height" ||
    e.data?.source !== "shadowing"
  ) return;

  // znajdź iframe, który pokazuje shadowing
  const iframe = document.querySelector(
    'iframe[src*="/shadowing/"]'
  );

  if (!iframe) return;

  iframe.style.height = e.data.height + "px";
});

