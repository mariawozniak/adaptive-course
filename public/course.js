import { modules } from "../data/modules.js";

const app = document.getElementById("app");
const module = modules[0];

let activeActivity = null;
let activeVariant = null;
let progress = {};

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

// ===============================
// PROGRESS HELPERS
// ===============================
function isCompleted(lessonId) {
  if (!lessonId) return false;

  return Boolean(
    progress?.[module.id]?.completedLessons?.[lessonId]
  );
}
function isActivityCompleted(activity) {
  if (!activity?.variants?.length) return false;

  // Słówka → wystarczy jedna ukończona lekcja
  if (activity.completionRule === "any") {
    return activity.variants.some(v => isCompleted(v.id));
  }

  // Domyślnie: wszystkie
  return activity.variants.every(v => isCompleted(v.id));
}


// ===============================
// UI HELPERS
// ===============================
function renderCompleteButton(item) {
  if (!item?.id) return "";
  if (item.type === "internal") return "";

  if (isCompleted(item.id)) {
    return `<button disabled>✔ Ukończone</button>`;
  }

  return `
    <button onclick="markCompleted('${item.id}')">
      ☐ Oznacz jako ukończone
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
              ${act.label}
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
 if (!activeActivity) {
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


  // Lista wariantów
  if (activeActivity.variants && !activeVariant) {
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
    return `
      <p>🛠 ${item.label}</p>
    `;
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
// INIT (WAŻNE)
// ===============================
async function init() {
  await ensureUser();   // ⬅️ najpierw cookie
  await loadProgress(); // ⬅️ potem progress
  render();
}
window.startModule = () => {
  activeActivity = module.activities[0];
  activeVariant = null;
  render();
};


init();
