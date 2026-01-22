import { modules } from "../data/modules.js";

const app = document.getElementById("app");
const module = modules[0];

let activeActivity = null;
let activeVariant = null;
let progress = {};

// ===== PROGRESS =====
async function loadProgress() {
  const res = await fetch("/api/progress", { credentials: "include" });
  progress = await res.json();
}

function isCompleted(lessonId) {
  return progress?.[module.id]?.completedLessons?.[lessonId] === true;
}

// ===== UI =====
function renderCompleteButton(lessonId) {
  if (isCompleted(lessonId)) return "";
  return `
    <button onclick="markCompleted('${lessonId}')">
      ☑ Ukończone
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

    <div id="content">
      ${renderContent()}
    </div>
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

  // aktywność z lekcjami (variants)
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

  // IFRAME
  if (item.type === "iframe") {
    return `
      <iframe
        src="${item.src}"
        width="100%"
        height="800"
        style="border:none;"
      ></iframe>
      ${renderCompleteButton(item.id)}
    `;
  }

  // AUDIO
  if (item.type === "audio") {
    return `
      <audio controls src="${item.src}"></audio>
      ${renderCompleteButton(item.id)}
    `;
  }

  // PDF
  if (item.type === "pdf") {
    return `
      <iframe src="${item.src}" width="100%" height="800"></iframe>
      ${renderCompleteButton(item.id)}
    `;
  }

  // INTERNAL
  if (item.type === "internal") {
    return `
      <p>🛠 ${item.label} — do podłączenia</p>
      ${renderCompleteButton(item.id)}
    `;
  }

  return `<p>Nieznany typ aktywności</p>`;
}

// ===== ACTION =====
window.markCompleted = async (lessonId) => {
  await fetch("/api/lesson-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      moduleId: module.id,
      lessonId
    })
  });

  await loadProgress();
  render();
};

// ===== START =====
loadProgress().then(render);
