// ===== GAPFILL ENGINE (1:1 jak stara lekcja) =====
console.log("🔥 GAPFILL ENGINE LOADED");


let SEGMENTS = [];
let VIDEO_ID = null;
let player = null;

let current = 0;
let watcher = null;
let score = 0;
let showedAnswers = false;
let quizStarted = false;
let maxScore = 0;

// ===== UI helpers =====

function updateScoreBox(){
  document.getElementById("scoreBox").textContent = `${score} / ${maxScore}`;
}

// ===== Rendering =====

function renderParts(parts){
  const frag = document.createDocumentFragment();

  parts.forEach(p => {
    if (!p.gap) {
      const span = document.createElement("span");
      span.textContent = p.text + " ";
      frag.appendChild(span);
    } else {
      const span = document.createElement("span");
      span.className = "gap";

      const input = document.createElement("input");
      input.value = p.userAnswer || "";
      input.placeholder = "…";
      input.dataset.answer = p.text;

      input.addEventListener("input", e => {
        p.userAnswer = e.target.value;
      });

      span.appendChild(input);
      frag.appendChild(span);
      frag.appendChild(document.createTextNode(" "));
    }
  });

  return frag;
}

function renderEvaluation(parts){
  const frag = document.createDocumentFragment();

  parts.forEach(p => {
    if (!p.gap) {
      const span = document.createElement("span");
      span.textContent = p.text + " ";
      frag.appendChild(span);
    } else {
      const span = document.createElement("span");
      span.className = "gap";

      if (p.isCorrect) {
        span.innerHTML = `<span style="color:#35c28d">${p.text}</span>`;
      } else {
        const user = p.userAnswer?.trim() || "—";
        span.innerHTML =
          `<span style="color:#ff6b6b">${user}</span> → ` +
          `<span style="color:#35c28d">${p.text}</span>`;
      }

      frag.appendChild(span);
      frag.appendChild(document.createTextNode(" "));
    }
  });

  return frag;
}

// ===== Question flow =====

function showQuestion(seg){
  const q = document.getElementById("qtext");
  q.innerHTML = "";

  const wasChecked = seg.parts.some(p => p.gap && p.isCorrect !== null);

  if (wasChecked) {
    q.appendChild(renderEvaluation(seg.parts));
  } else {
    q.appendChild(renderParts(seg.parts));
  }

  document.getElementById("overlay").style.display = "flex";
}

function hideQuestion(){
  document.getElementById("overlay").style.display = "none";
}

// ===== Video flow =====

function playSegment(idx){
  const seg = SEGMENTS[idx];

  player.seekTo(seg.start, true);
  player.playVideo();

  if (watcher) clearInterval(watcher);

  watcher = setInterval(() => {
    if (player.getCurrentTime() >= seg.end) {
      clearInterval(watcher);
      player.pauseVideo();

      if (idx === SEGMENTS.length - 1) {
        showEndScreen();
      } else {
        showQuestion(seg);
      }
    }
  }, 200);
}

// ===== Navigation =====

function nextSegment(){
  const inputs = document.querySelectorAll("#qtext input");

  inputs.forEach(inp => {
    const userVal = inp.value.trim().toLowerCase();
    const correctVal = inp.dataset.answer.toLowerCase();
    const part = SEGMENTS[current].parts.find(
      p => p.gap && p.text === inp.dataset.answer
    );

    if (userVal === correctVal) {
      score++;
      if (part) part.isCorrect = true;
    } else {
      if (part) part.isCorrect = false;
    }
  });

  updateScoreBox();

  if (!showedAnswers) {
    showedAnswers = true;
    showQuestion(SEGMENTS[current]);
    return;
  }

  hideQuestion();
  current++;
  showedAnswers = false;

  if (current < SEGMENTS.length) {
    playSegment(current);
  } else {
    showEndScreen();
  }
}

// ===== End =====

function showEndScreen(){
  player.pauseVideo();
  document.getElementById("finalScoreEnd").textContent =
    `${score} / ${maxScore}`;
  document.getElementById("endOverlay").style.display = "flex";
}

// ===== PUBLIC API =====

window.gapfillEngine = {
  init({ segments, videoId, ytPlayer }) {
    SEGMENTS = segments;
    VIDEO_ID = videoId;
    player = ytPlayer;

    current = 0;
    score = 0;
    showedAnswers = false;

    maxScore = SEGMENTS.reduce(
      (sum, seg) => sum + seg.parts.filter(p => p.gap).length,
      0
    );

    updateScoreBox();
  },

  play() {
    playSegment(current);
  },

  next() {
    nextSegment();
  }
};
