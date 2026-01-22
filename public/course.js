import { modules } from "../data/modules.js";

const app = document.getElementById("app");
const module = modules[0];

let activeActivity = null;
let activeVariant = null;
let progress = {};

// ===== PROGRESS =====
async function loadProgress() {
  try {
    const res = await fetch("/api/progress", { credentials: "include" });
    progress = await res.json();
  } catch {
    progress = {};
  }
}

function isCompleted(lessonId) {
  return Boolean(
    lessonId &&
    progress?.[module.id]?.completedLessons?.[lessonId]
  );
}

// ===== UI =====
function renderCompleteButton(lessonId) {
  if (!lessonId) return "";
  if (isCompleted(lessonId)) return "☑ Ukończone";

  return `
    <button onclick="markCompleted('${lessonId}')">
      ☑ Oznacz jako ukończone
    </button>
  `;
}

function render() {
  app.innerHTML = `
    <h1>${module.title}</h1>

    <div style="margin-bottom:16px;">
      ${module.activities
        .map(
          act =>
            `<button onclick="openActivity('${act.id}')">
              ${act.label}
            </button>`
        )
        .join("")}
    </div>

    <div id="content">${renderContent()}</div>
  `;
}

// ===== NAV =====
window.openActivity = (activityId) => {
  activeActivity = module.activities.find(a => a.id === activityId);
  activeVariant = null;
  render();
};

window.openVariant = (variantId) => {
  activeVariant = activeActivity.variants.find(v => v.id === variantId);
  render();
};

// ===== CONTENT =====
function renderContent() {
  if (!activeActivity) {
    return `<p>Wybierz aktywność.</p>`;
  }

  // lista lekcji
  if (activeActivity.variants && !activeVariant) {
    return `
      <h3>${activeActivity.label}</h3>
      <ul>
        ${activeActivity.variants
          .map(
            v =>
              `<li>
                <button onclick="openVariant('${v.id}')">
                  ${isCompleted(v.id) ? "☑" : "☐"} ${v.label}
                </button>
              </li>`
          )
          .join("")}
      </ul>
    `;
  }

  const item = activeVariant || activeActivity;
  const lessonId = item.lessonId || item.id || null;

  if (item.type === "iframe") {
    return `
      <iframe src="${item.src}" width="100%" height="800"></iframe>
      <div>${renderCompleteButton(lessonId)}</div>
    `;
  }

  if (item.type === "audio") {
    return `
      <audio controls src="${item.src}"></audio>
      <div>${renderCompleteButton(lessonId)}</div>
    `;
  }

  if (item.type === "pdf") {
    return `
      <iframe src="${item.src}" width="100%" height="800"></iframe>
      <div>${renderCompleteButton(lessonId)}</div>
    `;
  }

  if (item.type === "internal") {
    return `
      <p>🛠 ${item.label}</p>
      <div>${renderCompleteButton(item.lessonId)}</div>
    `;
  }

  return `<p>Nieznany typ</p>`;
}

// ===== ACTION =====
window.markCompleted = async (lessonId) => {
  if (!lessonId) return;

  const res = await fetch("/api/lesson-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

// ===== START =====
loadProgress().then(render);
