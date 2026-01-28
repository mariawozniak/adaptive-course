// public/listening/js/core.js
(() => {
  "use strict";

  // ---- URL params ----
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "gapfill";
  const moduleName = params.get("module") || "module_1";

  // ---- DOM ----
  const scoreBoxEl = document.getElementById("scoreBox");

  // ---- runtime ----
  let data = null;              // loaded JSON
  let engine = null;            // selected engine instance
  let player = null;            // YT player
  let watcher = null;           // interval id
  let currentSegmentIndex = 0;  // global progress
  let score = 0;
  let maxScore = 0;
  let startedOnce = false;


  // ---- helpers ----
 

  function updateScoreBox() {
    if (!scoreBoxEl) return;
    scoreBoxEl.textContent = `${score} / ${maxScore}`;
  }

  function clearWatcher() {
    if (watcher) {
      clearInterval(watcher);
      watcher = null;
    }
  }

  function exitFullscreenIfAny(){
  // normal fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(()=>{});
  }

  // iOS pseudo fullscreen
  const playerEl = document.querySelector(".player");
  if (playerEl) playerEl.classList.remove("ios-fullscreen");
  document.body.style.overflow = "";
}

  // ---- CORE API for engines ----
  const CORE_API = {
    playSegment(index) {
      playSegment(index);
    },
    showOverlay() {
      const overlay = document.getElementById("overlay");
      if (overlay) overlay.style.display = "flex";
    },
    hideOverlay() {
      const overlay = document.getElementById("overlay");
      if (overlay) overlay.style.display = "none";
    },
    setScore(delta) {
      score += delta;
      updateScoreBox();
    },
    updateScoreBox() {
      updateScoreBox();
    },
    finishExercise() {
      // Na razie minimalnie: engine może wołać finish.
      // Docelowo: ekran końcowy + restart itp.
      clearWatcher();
      if (player) player.pauseVideo();

        exitFullscreenIfAny(); // 🔥 auto-exit fullscreen

      const endOverlay = document.getElementById("endOverlay");
      const finalScoreEnd = document.getElementById("finalScoreEnd");
      if (finalScoreEnd) finalScoreEnd.textContent = `${score} / ${maxScore}`;
      if (endOverlay) endOverlay.style.display = "flex";
    },
    getCurrentSegmentIndex() {
      return currentSegmentIndex;
    },
    setMaxScore(n) {
  maxScore = n;
  updateScoreBox();
}

  };

  // ---- segment control ----
  function playSegment(index) {
    if (!data || !player) return;

    const seg = data.segments[index];
    if (!seg) return;

    currentSegmentIndex = index;

    player.seekTo(seg.start, true);
    player.playVideo();

    clearWatcher();
    watcher = setInterval(() => {
      const t = player.getCurrentTime();
      if (t >= seg.end) {
        clearWatcher();
        player.pauseVideo();
        if (engine && typeof engine.onSegmentEnd === "function") {
          engine.onSegmentEnd(index);
        }
      }
    }, 200);
  }

  // ---- engine selection ----
  function pickEngine(mode) {
    // Na razie tylko gapfill — reszta później.
    if (mode === "gapfill") return window.gapfillEngine;
    if (mode === "quiz") return window.quizEngine;
    if (mode === "mixed") return window.mixedEngine;
    throw new Error(`Unknown mode: ${mode}`);
  }

  // ---- data loading ----
  async function loadModuleJson() {
const path = `/data/listening/${moduleName}.${mode}.json`;
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Cannot load JSON: ${path} (${res.status})`);
    return await res.json();
  }

  // ---- YouTube bootstrap ----
  function loadYouTubeIframeApi() {
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) return resolve();

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      resolve();
    });
  }

  function createPlayer(videoId) {
    return new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player("yt", {
          videoId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => resolve(player),
 onStateChange: (event) => {
  if (event.data === YT.PlayerState.ENDED) {
    // 🔒 tylko jeśli to naprawdę OSTATNI segment
    if (currentSegmentIndex >= data.segments.length - 1) {
      CORE_API.finishExercise();
    }
  }
}

          }
        });
      };
    });
  }
function nextSegment() {
  // 👉 jeśli engine (np. mixed) chce przejąć „Dalej”
  if (engine && typeof engine.onNext === "function") {
    const canProceed = engine.onNext(currentSegmentIndex);

    // engine mówi: „jeszcze nie”
    if (canProceed === false) return;
  }

  // standardowe przejście dalej
  CORE_API.hideOverlay();
  currentSegmentIndex++;

  if (currentSegmentIndex < data.segments.length) {
    playSegment(currentSegmentIndex);
  } else {
    CORE_API.finishExercise();
  }
}

  // ---- init ----
async function start() {
  data = await loadModuleJson();
  score = 0;
  maxScore = 0;
  updateScoreBox();

  engine = pickEngine(mode);
  if (!engine || typeof engine.init !== "function") {
    throw new Error(`Engine for mode=${mode} is missing or invalid.`);
  }

  engine.init(data, CORE_API);

  await loadYouTubeIframeApi();
  await createPlayer(data.videoId);

  // ===== START CONTROL (monolit style) =====
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

function startFirstSegment(){
  if (startedOnce) return;
  startedOnce = true;
  playSegment(0);
}


  window.__LISTENING_START__ = startFirstSegment;

  if (!isMobile) {
    startFirstSegment();
  }

  // buttons
  const nextBtn = document.getElementById("next");
  if (nextBtn) nextBtn.onclick = nextSegment;

  const replayBtn = document.getElementById("replayBtn");
  if (replayBtn) {
    replayBtn.onclick = () => {
      CORE_API.hideOverlay();
      clearWatcher();
      playSegment(currentSegmentIndex);
      if (engine && typeof engine.onReplay === "function") {
        engine.onReplay(currentSegmentIndex);
      }
    };
  }
}




  // Globalnie dla debug (opcjonalnie)
  window.__CORE__ = { CORE_API };

  // Odpal
  start().catch((err) => {
    console.error(err);
    alert(err.message || String(err));
  });
})();
