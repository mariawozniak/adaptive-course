import { modules } from "../data/modules.js";

const app = document.getElementById("app");
const currentModule = modules[0];

let moduleStarted = false; // 🔑 KLUCZOWE
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;


// ===============================
// API
// ===============================
async function ensureUser() {
  await fetch("/api/me", {
    credentials: "include"
  });
}

async function loadProgress() {
  try {
    const res = await fetch("/api/progress", {
      credentials: "include"
    });
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
    progress?.[module.id]?.completedLessons?.[lessonId]
  );
}

function getLessonId(item) {
  if (!item) return null;

  // wariant (audio, pdf, listening)
  if (item.id && !item.lessonId) {
    return item.id;
  }

  // aktywność = jedna lekcja (Test, Shadowing)
  if (item.lessonId) {
    return item.lessonId;
  }

  return null;
}

function isActivityCompleted(activity) {
  if (!activity) return false;

  // aktywności z wariantami (Słówka, Listening)
  if (activity.variants?.length) {
    if (activity.completionRule === "any") {
      return activity.variants.some(v => isCompleted(v.id));
    }
    return activity.variants.every(v => isCompleted(v.id));
  }

  // aktywności = jedna lekcja (Test, Shadowing)
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

  // internal = brak ręcznego checkboxa
  if (item.type === "internal") return "";

  const completed = isCompleted(lessonId);

  return `
    <button onclick="markCompleted('${lessonId}')">
      ${completed ? "☑" : "☐"} Oznacz jako ukończone
    </button>
  `;
}

// ===============================
// RENDER
// ===============================
function render() {
  app.innerHTML = `
    <h1>${module.title}</h1>

    <div style="margin-bottom:16px;">
      ${module.activities
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
    </div>
  `;
}

// ===============================
// NAVIGATION
// ===============================
window.openActivity = (activityId) => {
  moduleStarted = true;
  activeActivity = module.activities.find(a => a.id === activityId);
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
  // 1) WYBÓR POZIOMU (jeśli brak)
  if (!currentLevel) {
    return `
      <h2>Wybierz poziom startowy</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${[1,2,3,4,5].map(lvl => `
          <button onclick="chooseLevel(${lvl})">Poziom ${lvl}</button>
        `).join("")}
      </div>
    `;
  }

  // ...reszta Twojego renderContent() bez zmian

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
          src="/assets/covers/module_1.jpg"
          alt="${module.title}"
          style="max-width:320px;border-radius:16px;"
        />

        <h2>${module.title}</h2>

        <button
          style="
            padding:14px 28px;
            font-size:18px;
            font-weight:600;
            cursor:pointer;
          "
          onclick="startModule()"
        >
          ▶ Rozpocznij
        </button>
      </div>
    `;
  }

  // Lista wariantów (Słówka, Listening)
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
    return `
      <iframe src="${item.src}" width="100%" height="800"></iframe>
      <div>${renderCompleteButton(item)}</div>
    `;
  }

  if (item.type === "audio") {
    return `
      <audio controls src="${item.src}"></audio>
      <div>${renderCompleteButton(item)}</div>
    `;
  }

  if (item.type === "pdf") {
    return `
      <iframe src="${item.src}" width="100%" height="800"></iframe>
      <div>${renderCompleteButton(item)}</div>
    `;
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
  if (!lessonId) return;

  const res = await fetch("/api/lesson-complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      moduleId: module.id,
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

// ===============================
// INIT
// ===============================


window.startModule = () => {
  moduleStarted = true;
  activeActivity = module.activities[0];
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

async function init() {
  await ensureUser();
  await loadProgress();
  await loadState();   // ✅ DODAJ TO
  render();
}


init();
