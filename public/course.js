
const app = document.getElementById("app");

let modules = [];              // NAJPIERW
let currentModule = null;      // nie modules[0]
let moduleStarted = false;
let activeActivity = null;
let activeVariant = null;
let progress = {};
let currentLevel = null;
let finalFeedbackShown = false;
let deferredInstallPrompt = null;



// ===== LEVEL -> MODULE MAP (FRONTEND) =====
// USTAW TU, który moduł ma być otwierany dla danego poziomu.
// Na start możesz zostawić wszystko na module_1, potem zmienisz.

async function loadModules() {
  const res = await fetch("/api/modules", {
    credentials: "include"
  });
  modules = await res.json();
}


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
function restoreFromURL() {
  const params = new URLSearchParams(window.location.search);

  const moduleId = params.get("module");
  const started = params.get("started") === "1";
  const activityId = params.get("activity");
  const variantId = params.get("variant");

const levelParam = params.get("level");

if (levelParam) {
  const level = Number(levelParam);

  if ([1,2,3,4,5].includes(level)) {
    currentLevel = level;
    setModuleForLevel(level);
  }
}


  // 2) Module (nadpisuje wybrany przez setModuleForLevel jeśli jest w URL)
  if (moduleId) {
    const mod = modules.find(m => m.id === moduleId);
    if (mod) currentModule = mod;
  }

  // 3) Started
  moduleStarted = started;

  // 4) Activity
if (activityId && currentModule?.activities?.length) {
  const found = currentModule.activities.find(a => a.id === activityId);
  if (found) {
    activeActivity = found;
    moduleStarted = true;
  } else {
    activeActivity = null;
  }
}


  // 5) Variant
  if (variantId && activeActivity?.variants?.length) {
    activeVariant = activeActivity.variants.find(v => v.id === variantId) || null;
  } else {
    activeVariant = null;
  }
}

// ===============================
// MODULE HUB HELPERS (NEW, SAFE)
// ===============================

// czy moduł jest w 100% ukończony (NIE KOLIDUJE ze starą logiką)
function isModuleHubDone(module) {
  if (!module?.activities) return false;

  return module.activities
    .filter(a => a.required)
    .every(activity => {
      if (Array.isArray(activity.variants) && activity.variants.length) {
        if (activity.completionRule === "any") {
          return activity.variants.some(v =>
            progress?.[module.id]?.completedLessons?.[v.id]
          );
        }
        return activity.variants.every(v =>
          progress?.[module.id]?.completedLessons?.[v.id]
        );
      }

      if (activity.lessonId) {
        return Boolean(
          progress?.[module.id]?.completedLessons?.[activity.lessonId]
        );
      }

      return true;
    });
}

// lista modułów widocznych w karuzeli
function getVisibleModulesForUser() {
  if (!Array.isArray(modules) || !modules.length) return [];

  // 1️⃣ grupujemy moduły po levelu
  const byLevel = modules.reduce((acc, m) => {
    acc[m.level] ||= [];
    acc[m.level].push(m);
    return acc;
  }, {});

  // 2️⃣ dostępne levele w treściach
  const availableLevels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // 3️⃣ jeśli brak levela usera → pokaż wszystko
  if (!currentLevel || !availableLevels.length) {
    return modules.slice().sort((a, b) => a.id.localeCompare(b.id));
  }

  // 4️⃣ znajdź NAJBLIŻSZY dostępny level
  let closestLevel = availableLevels[0];
  let minDiff = Math.abs(currentLevel - closestLevel);

  for (const lvl of availableLevels) {
    const diff = Math.abs(currentLevel - lvl);
    if (diff < minDiff) {
      minDiff = diff;
      closestLevel = lvl;
    }
  }

  // 5️⃣ bierzemy moduły z tego levelu
  const sameLevel = byLevel[closestLevel] || [];

  // 6️⃣ zawsze dodajemy ukończone (z innych leveli)
  const completed = modules.filter(m => isModuleHubDone(m));

  // 7️⃣ merge bez duplikatów
  const map = new Map();
  [...sameLevel, ...completed].forEach(m => map.set(m.id, m));

  return Array.from(map.values()).sort((a, b) => {
    if ((a.level ?? 0) !== (b.level ?? 0)) {
      return (a.level ?? 0) - (b.level ?? 0);
    }
    return a.id.localeCompare(b.id);
  });
}


// który moduł ma być na środku karuzeli
function pickHubFocusModule() {
  const visible = getVisibleModulesForUser();
  if (!visible.length) return null;

  // 1️⃣ jeśli user NIE MA levela → pierwszy
  if (!currentLevel) return visible[0];

  // 2️⃣ moduły z aktualnego levelu
  const sameLevel = visible.filter(m => m.level === currentLevel);

  // 3️⃣ pierwszy NIEukończony z tego levelu
  const firstNotDone = sameLevel.find(m => !isModuleHubDone(m));
  if (firstNotDone) return firstNotDone;

  // 4️⃣ jeśli level ukończony → SZUKAMY WYŻSZEGO LEVELU
  const higherLevel = visible.find(
    m => m.level > currentLevel && !isModuleHubDone(m)
  );
  if (higherLevel) return higherLevel;

  // 5️⃣ fallback (wszystko ukończone)
  return visible[visible.length - 1];
}


// ===============================
// URL STATE (zapisywanie widoku do URL)
// ===============================
function updateURL() {
  const params = new URLSearchParams();

  if (currentLevel) params.set("level", String(currentLevel));
  if (currentModule?.id) params.set("module", currentModule.id);
  if (moduleStarted) params.set("started", "1");
  if (activeActivity?.id) params.set("activity", activeActivity.id);
  if (activeVariant?.id) params.set("variant", activeVariant.id);

  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

  // replaceState = zmienia URL bez dodawania historii (Back działa normalnie)
  window.history.replaceState({}, "", newUrl);
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
// MODULE HUB RENDER (NEW)
// ===============================
function renderModuleHub() {
  const visibleModules = getVisibleModulesForUser();
  const focus = pickHubFocusModule();

  if (!visibleModules.length) {
    return `<p style="padding:24px">Brak modułów</p>`;
  }

  return `
    <div class="module-hub">

      <!-- ⬅️ STRZAŁKA LEWA -->
      <button
        class="carousel-arrow left"
        onclick="scrollCarousel(-1)"
        aria-label="Poprzedni moduł"
      >
        ←
      </button>

      <!-- 🎠 KARUZELA -->
      <div class="module-carousel" id="moduleCarousel">
        ${visibleModules.map(m => {
          const isActive = focus && m.id === focus.id;
          const isDone = isModuleHubDone(m);

          return `
            <div
              class="module-tile ${isActive ? "is-active" : ""}"
              onclick="openModuleFromHub('${m.id}')"
            >
              <img
                src="/assets/covers/${m.id}.jpg"
                class="module-tile-cover"
                alt="${m.title}"
              />

              <div class="module-tile-body">
                <h3 class="module-tile-title">${m.title}</h3>
                <div class="module-tile-meta">
                  Poziom ${m.level}
                </div>
              </div>

              <div class="module-tile-badges">
                ${isDone ? `<span class="module-badge done">✓</span>` : ``}
              </div>

              ${renderActivitiesPreviewInTile(m)}
            </div>
          `;
        }).join("")}
      </div>

      <!-- ➡️ STRZAŁKA PRAWA -->
      <button
        class="carousel-arrow right"
        onclick="scrollCarousel(1)"
        aria-label="Następny moduł"
      >
        →
      </button>

    </div>
  `;
}

function renderActivitiesPreviewInTile(module) {
  if (!module?.activities?.length) return "";

  return `
    <div class="module-tile-activities">
      ${module.activities.map(act => `
        <div
          class="module-tile-activity"
          onclick="event.stopPropagation(); openActivity('${act.id}')"
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


function renderActivitiesPreviewInTile(module) {
  if (!module?.activities?.length) return "";

  const isActiveModule = module.id === currentModule?.id;

  return `
    <div class="module-tile-activities">
      ${module.activities.map(act => {
        const showCheckbox =
          isActiveModule && shouldRenderCheckbox(act);

        const lessonId = getLessonId(act);

        return `
          <div
            class="module-tile-activity"
            onclick="event.stopPropagation(); openActivity('${act.id}')"
          >
            <span class="activity-status ${
              isActivityCompleted(act) ? "done" : ""
            }"></span>

            <span class="activity-label">${act.label}</span>

            ${
              showCheckbox
                ? `<input
                     type="checkbox"
                     ${isCompleted(lessonId) ? "checked" : ""}
                     onclick="event.stopPropagation(); markCompleted('${lessonId}')"
                   />`
                : ``
            }
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// ===============================
// RENDER
// ===============================
function render() {
  const isHub = !moduleStarted;

  app.innerHTML = `
    <div id="content">
      <div class="${isHub ? "" : "module-inner"}">
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
    updateURL();
    render();
    return;
  }

  if (activeActivity) {
    activeActivity = null;
    updateURL();
    render();
    return;
  }

  if (moduleStarted) {
    moduleStarted = false;
    updateURL();
    render();
  }
};


window.openActivity = (activityId) => {
  moduleStarted = true;
  activeActivity = currentModule.activities.find(a => a.id === activityId);
  activeVariant = null;
  updateURL();
  render();
};


window.openVariant = (variantId) => {
  activeVariant = activeActivity.variants.find(v => v.id === variantId);
  updateURL();
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

function renderLessonDifficultyBottom() {
  return `
    <div class="lesson-difficulty-bottom">
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
    <h1 class="course-title">
      Kurs do Nauki Angielskiego z Piosenek i Seriali
    </h1>

    ${renderModuleHub()}
  `;
}




if (moduleStarted && !activeActivity) {
  return `
    ${renderListHeader(currentModule.title)}

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

    ${renderLessonDifficultyBottom()}
  `;



if (item.type === "audio")
  return `
    ${renderLessonHeader(item)}

    <div class="lesson-audio-wrapper">
<audio
  controls
  controlsList="nodownload"
  preload="metadata"
>
  <source src="${item.src}" type="audio/mpeg" />
</audio>

    </div>

    ${renderLessonDifficultyBottom()}
  `;


if (item.type === "pdf")
  return `
    ${renderLessonHeader(item)}

    <iframe src="${item.src}" width="100%" height="800"></iframe>

    ${renderLessonDifficultyBottom()}
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

  // 🔥 NOWE: jeśli moduł ukończony → ekran gratulacji
  if (isModuleCompleted()) {
    window.location.href = "/module-complete.html";
    return;
  }

  render();
};

window.openModuleFromHub = (moduleId) => {
  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return;

  currentModule = mod;
  moduleStarted = true;   // ✅ KLUCZ
  activeActivity = null;
  activeVariant = null;

  updateURL();
  render();
};

window.scrollCarousel = (direction) => {
  const carousel = document.getElementById("moduleCarousel");
  if (!carousel) return;

  const tileWidth = 240; // MUSI PASOWAĆ do CSS
  const gap = 24;
  const scrollAmount = tileWidth + gap;

  carousel.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth"
  });
};


window.startModule = () => {
  moduleStarted = true;
  activeActivity = null;
  activeVariant = null;
  updateURL();
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
  updateURL();
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
  updateURL();
render();

};


function showInstallPrompt() {
  if (document.querySelector(".install-prompt")) return;

  const overlay = document.createElement("div");
  overlay.className = "install-prompt";

  // 🔥 HARD INLINE STYLES (pewne)
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.6)"
  });

  overlay.innerHTML = `
    <div class="install-box">
      <p style="font-size:18px;font-weight:600;margin-bottom:8px;">
        📲 Dodać kurs do ekranu głównego?
      </p>
      <p style="font-size:14px;color:#6b4e2e;margin-bottom:20px;">
        Szybszy dostęp i działanie jak aplikacja
      </p>
      <div style="display:flex;gap:12px;">
        <button id="install-yes">OK</button>
        <button id="install-no">Nie, dziękuję</button>
      </div>
    </div>
  `;

  const box = overlay.querySelector(".install-box");
  Object.assign(box.style, {
    background: "#fffaf4",
    borderRadius: "24px",
    padding: "28px 24px",
    width: "min(90vw, 360px)",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,.25)"
  });

  const yes = overlay.querySelector("#install-yes");
  const no = overlay.querySelector("#install-no");

  [yes, no].forEach(btn => {
    Object.assign(btn.style, {
      flex: "1",
      height: "48px",
      borderRadius: "999px",
      border: "none",
      fontSize: "15px",
      cursor: "pointer"
    });
  });

  yes.style.background = "#e67e22";
  yes.style.color = "#fff";
  no.style.background = "#f1e3d3";

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  yes.onclick = async () => {
    localStorage.setItem("a2hs_prompted", "yes");
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    }
    close();
  };

  no.onclick = () => {
    close();
  };

  function close() {
    document.body.style.overflow = "";
    overlay.remove();
  }
}






// ===============================
// INIT
// ===============================
async function init() {
  // 1️⃣ upewnij się, że user istnieje (cookie)
  await ensureUser();

  // 2️⃣ pobierz strukturę kursu (MUSI być pierwsze)
  await loadModules();

  // 3️⃣ pobierz progress
  await loadProgress();

  // 4️⃣ pobierz level z backendu
  await loadState();   // ← TU level z bazy

  // 5️⃣ odtwórz stan z URL (jeśli ktoś wraca do lekcji)
  restoreFromURL();

  // 6️⃣ jeśli backend dał level, ale URL go nie nadpisał
  if (currentLevel && !currentModule) {
    setModuleForLevel(currentLevel);
  }

// ===== DEBUG (TYLKO DO SPRAWDZENIA) =====
window.__debug = {
  modules,
  currentLevel,
  getVisibleModulesForUser,
  pickHubFocusModule
};

updateURL();
render();

}


init();



// ===============================
// iframe auto-height — TYLKO shadowing
// ===============================

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // ⛔️ BLOKUJE SYSTEMOWY PROMPT
  deferredInstallPrompt = e;

  // pokaż tylko jeśli NIE było jeszcze na tym urządzeniu
  const asked = localStorage.getItem("a2hs_prompted");
  if (asked === "yes") return;

  // opóźnienie = lepszy UX (iOS/Android)
  setTimeout(() => {
    showInstallPrompt();
  }, 600);
});

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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
