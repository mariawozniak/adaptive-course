console.log("🧠 CORE LOADED");

const params = new URLSearchParams(window.location.search);
const MODE = params.get("mode") || "gapfill";
const MODULE_ID = params.get("module") || "module_1";

window.APP_CONTEXT = { MODE, MODULE_ID };

// ====== STATE ======
let player;
let data;
let engine;
let currentSegment = 0;
let score = 0;
let watcher = null;

// ====== DOM ======
const overlay = document.getElementById("overlay");
const scoreBox = document.getElementById("scoreBox");

// ====== CORE API (dla engine) ======
const CORE_API = {
  playSegment,
  showOverlay,
  hideOverlay,
  setScore,
  updateScoreBox,
  finishExercise
};

// ====== INIT ======
init();

async function init() {
  data = await loadModuleData(MODULE_ID);

  engine = loadEngine(MODE);
  engine.init(data, CORE_API);

  initYouTube(data.videoId);
  bindUI();
  updateScoreBox();
}

// ====== LOADERS ======
async function loadModuleData(moduleId) {
  const res = await fetch(`/data/listening/${moduleId}.gapfill.json`);
  return await res.json();
}

function loadEngine(mode) {
  if (mode === "gapfill") return window.GapFillEngine;
  if (mode === "quiz") return window.QuizEngine;
  if (mode === "mixed") return window.MixedEngine;
  throw new Error("Unknown mode: " + mode);
}

// ====== UI ======
function bindUI() {
  document.getElementById("next").onclick = () => engine.onNext();
  document.getElementById("replayBtn").onclick = () => engine.onReplay();
}

function showOverlay() {
  overlay.style.display = "flex";
}

function hideOverlay() {
  overlay.style.display = "none";
}

// ====== SCORE ======
function setScore(delta) {
  score += delta;
}

function updateScoreBox() {
  scoreBox.textContent = `${score} / ${data.maxScore}`;
}

// ====== VIDEO ======
function initYouTube(videoId) {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("yt", {
      videoId,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onStateChange
      }
    });
  };
}

function playSegment(index) {
  const seg = data.segments[index];
  currentSegment = index;

  player.seekTo(seg.start, true);
  player.playVideo();

  if (watcher) clearInterval(watcher);

  watcher = setInterval(() => {
    if (player.getCurrentTime() >= seg.end) {
      clearInterval(watcher);
      player.pauseVideo();
      engine.onSegmentEnd();
    }
  }, 200);
}

function onStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING && currentSegment === 0) {
    playSegment(0);
  }
}

// ====== END ======
function finishExercise() {
  alert(`Koniec 🎉 Wynik: ${score}/${data.maxScore}`);
}
