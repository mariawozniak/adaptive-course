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
  let waitingForStart = true;
let overlayLocked = false;
let segmentTimeout = null;


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

  // ---- CORE API for engines ----
  const CORE_API = {
    playSegment(index) {
      playSegment(index);
    },
    showOverlay() {
  overlayLocked = true;
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "flex";
},
hideOverlay() {
  overlayLocked = false;
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
        overlayLocked = false;

      // Na razie minimalnie: engine może wołać finish.
      // Docelowo: ekran końcowy + restart itp.
      clearWatcher();
      if (player) player.pauseVideo();
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
  if (waitingForStart) return;
  if (!data || !player) return;

  const seg = data.segments[index];
  if (!seg) return;

  currentSegmentIndex = index;

  clearWatcher();
  if (segmentTimeout) {
    clearTimeout(segmentTimeout);
    segmentTimeout = null;
  }

  player.seekTo(seg.start, true);
  player.playVideo();

  const durationMs = Math.max(0, (seg.end - seg.start) * 1000);

  // 🔥 GŁÓWNY MECHANIZM (DZIAŁA NA MOBILE)
  segmentTimeout = setTimeout(() => {
    player.pauseVideo();
    engine?.onSegmentEnd?.(index);
  }, durationMs + 150);

  // 👀 watcher tylko jako pomoc (desktop)
  watcher = setInterval(() => {
    const t = player.getCurrentTime();
    if (t >= seg.end) {
      clearWatcher();
      if (segmentTimeout) {
        clearTimeout(segmentTimeout);
        segmentTimeout = null;
      }
      player.pauseVideo();
      engine?.onSegmentEnd?.(index);
    }
  }, 250);
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

    // 🔒 jeśli quiz/gapfill przejął kontrolę – nic nie rób
    if (overlayLocked) return;

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
    if (mode === "quiz") return;

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

  // ===============================
// FULLSCREEN START (MOBILE)
// ===============================
function setupStartOverlay() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) {
    waitingForStart = false;
    playSegment(0);
    return;
  }


const btn = document.getElementById("startBtn");
if (!btn) return;



  btn.onclick = () => {

    


    // 🔥 poinformuj parent (fullscreen)
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "listening-start" },
        "*"
      );
    }

    waitingForStart = false;
    playSegment(0);
  };
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

    // init engine (render + handlers), engine dostaje CORE_API
    engine.init(data, CORE_API);

    await loadYouTubeIframeApi();
    await createPlayer(data.videoId);
    setupStartOverlay();


    // Start: od razu odtwarzamy pierwszy segment (jak w prototypie po PLAY)
    // Tu celowo upraszczam: startujemy automatycznie.
    // Jeśli chcesz wymusić kliknięcie play → powiemy engine/core jak to zsynchronizować.
  }

  const replayBtn = document.getElementById("replayBtn");
if (replayBtn) {
  replayBtn.onclick = () => {
    // ukryj overlay
    CORE_API.hideOverlay();

    // zatrzymaj watcher
    clearWatcher();

    // cofnij wideo do początku aktualnego segmentu
    playSegment(currentSegmentIndex);

    // 🔥 poinformuj engine (mixed / quiz / gapfill)
  if (engine && typeof engine.onReplay === "function") {
  engine.onReplay(currentSegmentIndex);
}

  };
}



  // Globalnie dla debug (opcjonalnie)
  window.__CORE__ = { CORE_API };

  // Odpal
  start().catch((err) => {
    console.error(err);
    alert(err.message || String(err));
  });
})();

