(() => {
  "use strict";

  /* =========================
     PARAMS
     ========================= */
  const params = new URLSearchParams(window.location.search);
  const moduleName = params.get("module") || "module_1";

  /* =========================
     DOM
     ========================= */
  const sentenceEl = document.getElementById("sentence");
  const statusEl   = document.getElementById("status");
  const endScreen  = document.getElementById("end-screen");
  const mainCard   = document.getElementById("main-card");

  /* =========================
     STATE
     ========================= */
  let data;
  let segments = [];
  let iSeg = 0;
  let watcher = null;
  let recInstance = null;
  let isPlayingVideoSegment = false;

  let player;
  let playerReady = Promise.resolve();

  /* =========================
     LOAD DATA
     ========================= */
  async function loadData() {
    const res = await fetch(`/data/shadowing/${moduleName}.shadowing.json`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Nie można załadować shadowing data");

    data = await res.json();
    segments = data.segments;
  }

  /* =========================
     PLAYER INIT
     ========================= */
  function initPlayer() {
    if (data.player.type === "youtube") {
      initYouTube();
    } else if (data.player.type === "vimeo") {
      initVimeo();
    } else {
      throw new Error("Nieznany typ playera");
    }
  }

  /* ===== YOUTUBE ===== */
 function initYouTube() {
  if (window.YT && YT.Player) {
    createYTPlayer();
  } else {
    window.onYouTubeIframeAPIReady = createYTPlayer;
  }
}

let startedByYT = false;

function createYTPlayer() {
  player = new YT.Player("ytplayer", {
    videoId: data.player.videoId,
    events: {
      onReady: () => {
        playerReady = Promise.resolve();
      },
      onStateChange: onYTStateChange
    }
  });
}

function onYTStateChange(e) {
  if (e.data === YT.PlayerState.ENDED) {
    startedByYT = false;
    return;
  }

  if (e.data === YT.PlayerState.PLAYING && !startedByYT) {
    startedByYT = true;
    iSeg = 0;
    playSegment(iSeg);
  }
}




  /* ===== VIMEO ===== */
  function initVimeo() {
    const iframe = document.getElementById("vimeoplayer");
    player = new Vimeo.Player(iframe);
    playerReady = player.ready();
  }

  /* =========================
     UTILS
     ========================= */
  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, ch =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])
    );
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[^a-z\s'"-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
// =========================
// EARLY FINISH – heurystyka monolitu
// =========================

// czy końcówki zdań się zgadzają (ostatnie N słów)
function tailsMatch(expected, spoken, tailWindow = 4) {
  const expWords = normalize(expected).split(/\s+/).filter(Boolean);
  const spkWords = normalize(spoken).split(/\s+/).filter(Boolean);

  if (!expWords.length || !spkWords.length) return false;

  const k = Math.min(tailWindow, expWords.length, spkWords.length);
  for (let i = 0; i < k; i++) {
    const ew = expWords[expWords.length - k + i];
    const sw = spkWords[spkWords.length - k + i];
    if (ew !== sw) return false;
  }
  return true;
}

// decyzja: czy możemy zakończyć nasłuch wcześniej
function earlyDone(expected, spoken) {
  const expWords = normalize(expected).split(/\s+/).filter(Boolean);
  const spkWords = normalize(spoken).split(/\s+/).filter(Boolean);

  if (!expWords.length) return false;

  // użytkownik powiedział >= 70% zdania
  const coverage = spkWords.length / expWords.length;
  if (coverage < 0.7) return false;

  // końcówka zdania się zgadza
  return tailsMatch(expected, spoken, 4);
}

  /* =========================
   DIFF ENGINE (z monolitu)
   ========================= */

function levenshtein(a, b) {
  a = a || ""; b = b || "";
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function consonantKey(w) {
  const n = normalize(w).replace(/[^a-z]/g, "");
  return n.replace(/[aeiouy]/g, "");
}

function isNearHomophone(expectedWord, spokenWord) {
  const eKey = consonantKey(expectedWord);
  const sKey = consonantKey(spokenWord);
  if (eKey.length >= 2 && eKey === sKey) return true;

  const e = normalize(expectedWord).replace(/[^a-z]/g, "");
  const s = normalize(spokenWord).replace(/[^a-z]/g, "");
  if (!e || !s) return false;

  const dist = levenshtein(e, s);
  const maxLen = Math.max(e.length, s.length);
  return maxLen <= 4 ? dist <= 1 : dist <= 2;
}

function diffWords(expectedText, spokenText) {
  const eOrig = expectedText.trim().split(/\s+/);
  const sOrig = spokenText.trim().split(/\s+/);
  const e = eOrig.map(w => normalize(w));
  const s = sOrig.map(w => normalize(w));

  const m = e.length, n = s.length;
  const dp = Array.from({length:m+1}, () => Array(n+1).fill(0));
  for (let i=0;i<=m;i++) dp[i][0] = i;
  for (let j=0;j<=n;j++) dp[0][j] = j;

  for (let i=1;i<=m;i++){
    for (let j=1;j<=n;j++){
      const cost = e[i-1] === s[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + cost
      );
    }
  }

  return { diff: outReverse(dp, eOrig, sOrig, e, s) };
}

function outReverse(dp, eOrig, sOrig, eNorm, sNorm){
  let i=eOrig.length, j=sOrig.length;
  const out=[];
  while(i>0||j>0){
    if (i > 0 && j > 0 &&
        dp[i][j] === dp[i-1][j-1] + (eNorm[i-1] === sNorm[j-1] ? 0 : 1)) {

      const expected = eOrig[i-1];
      const spoken   = sOrig[j-1];
      const near = (eNorm[i-1] !== sNorm[j-1]) && isNearHomophone(expected, spoken);

      out.push({
        type: (eNorm[i-1] === sNorm[j-1] || near) ? 'ok' : 'sub',
        expected,
        spoken: near ? expected : spoken
      });

      i--; j--;
    } else if(i>0 && dp[i][j] === dp[i-1][j] + 1){
      out.push({ type:'miss', expected:eOrig[i-1], spoken:'' });
      i--;
    } else {
      out.push({ type:'extra', expected:'', spoken:sOrig[j-1] });
      j--;
    }
  }
  out.reverse();
  return out;
}

function renderSpokenDiff(diffArr) {
  const html = diffArr
    .filter(tok => tok.spoken !== "")
    .map(tok => {
      if (tok.type === "ok") return `<span>${escapeHtml(tok.spoken)}</span>`;
      return `<span class="wrong">${escapeHtml(tok.spoken)}</span>`;
    })
    .join(" ");

  statusEl.innerHTML = `Powiedziałeś: ${html}`;
}

function renderExpectedDiff(diffArr) {
  sentenceEl.classList.remove("hidden");

  const html = diffArr
    .filter(tok => tok.expected !== "")
    .map(tok => {
      const raw = tok.expected;
      const safe = escapeHtml(raw);
      const enc  = encodeURIComponent(raw);
      const cls =
        tok.type === "ok"   ? "okw" :
        tok.type === "sub"  ? "sub" :
        tok.type === "miss" ? "miss" : "";
      return `<span class="word ${cls}" data-raw="${enc}">${safe}</span>`;
    })
    .join(" ");

  sentenceEl.innerHTML = html;
}


  /* =========================
     SENTENCE RENDER
     ========================= */
  function makeSentenceClickable(text) {
    return text.split(/\s+/).map(w => {
      const safe = escapeHtml(w);
      const enc  = encodeURIComponent(w);
      return `<span class="word" data-raw="${enc}">${safe}</span>`;
    }).join(" ");
  }

  /* =========================
     CONTROL
     ========================= */
  window.startShadowing = () => {
    endScreen.classList.add("hidden");
    mainCard.style.display = "block";
    iSeg = 0;
    playSegment(iSeg);
  };

  window.nextSegment = () => {
    if (iSeg + 1 < segments.length) {
      playSegment(++iSeg);
    } else {
      finish();
    }
  };

  window.prevSegment = () => {
    if (iSeg - 1 >= 0) playSegment(--iSeg);
  };

  window.retrySegment = () => {
    playSegment(iSeg);
  };

  window.markAsGood = () => {
    sentenceEl.className = "ok";
    statusEl.textContent = "Zaliczone ręcznie.";
    setTimeout(window.nextSegment, 900);
  };

  /* =========================
     PLAY SEGMENT
     ========================= */
  function playSegment(idx) {
    if (!segments[idx]) return;

    const seg = segments[idx];
  sentenceEl.className = "";
statusEl.textContent = "";
statusEl.classList.remove("listening");


    sentenceEl.innerHTML = makeSentenceClickable(seg.text);
    sentenceEl.classList.remove("hidden");

    isPlayingVideoSegment = true;
    try { speechSynthesis.cancel(); } catch {}

    if (watcher) clearInterval(watcher);

if (data.player.type === "youtube") {
  if (player.getPlayerState && player.getPlayerState() !== YT.PlayerState.PLAYING) {
    player.playVideo();
  }
  player.seekTo(seg.start, true);


      watcher = setInterval(() => {
        if (player.getCurrentTime() >= seg.end) {
          player.pauseVideo();
          stopSegment(seg.text);
        }
      }, 50);
    }

    if (data.player.type === "vimeo") {
      playerReady.then(() => {
        player.setCurrentTime(seg.start).then(() => player.play());
      });

      watcher = setInterval(() => {
        player.getCurrentTime().then(t => {
          if (t >= seg.end) {
            player.pause();
            stopSegment(seg.text);
          }
        });
      }, 100);
    }
  }

  function stopSegment(text) {
    clearInterval(watcher);
    watcher = null;
    isPlayingVideoSegment = false;
    statusEl.textContent = "Powtórz teraz…";
    setTimeout(() => startListening(text), 350);
  }

  /* =========================
     SPEECH RECOGNITION
     ========================= */
  function startListening(expectedText) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      statusEl.textContent = "Brak wsparcia SR";
      return;
    }

    if (recInstance) {
      try { recInstance.abort(); } catch {}
      recInstance = null;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let transcript = "";
    let inactivityTimer;

statusEl.textContent = "Słucham…";
statusEl.classList.add("listening");
let stopped = false;

function stop() {
  if (stopped) return;
  stopped = true;

  try { rec.stop(); } catch {}

  isPlayingVideoSegment = false; // ⬅️ BRAKOWAŁO

  statusEl.classList.remove("listening");

  const spoken = transcript.trim();
  if (!spoken) {
    statusEl.textContent = "Nic nie usłyszałem.";
    return;
  }

  const { diff } = diffWords(expectedText, spoken);
  renderSpokenDiff(diff);
  renderExpectedDiff(diff);
}



    function arm() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(stop, 1200);
    }

rec.onresult = e => {
  for (let i = e.resultIndex; i < e.results.length; i++) {
    if (e.results[i].isFinal) {
      transcript += e.results[i][0].transcript + " ";
    }
  }

  // 🔥 EARLY FINISH jak w monolicie
  if (earlyDone(expectedText, transcript)) {
    stop();
    return;
  }

  arm(); // standardowy timeout ciszy
};


    rec.onerror = () => stop();
    rec.onend   = () => stop();

    recInstance = rec;
    rec.start();
  }


  /* =========================
     FINISH
     ========================= */
  async function finish() {
    mainCard.style.display = "none";
    endScreen.classList.remove("hidden");

    try {
      await fetch("/api/lesson-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: data.moduleId,
          lessonId: data.lessonId
        })
      });
    } catch {}
  }
async function translateWord(word, sentence, targetEl) {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sentence })
    });

    if (!res.ok) throw new Error("Translate failed");

    const data = await res.json();
    showPopup(targetEl, data.translation || "(brak tłumaczenia)");
  } catch (err) {
    console.error(err);
    showPopup(targetEl, "❌ błąd tłumaczenia");
  }
}
function showPopup(targetEl, text) {
  document.querySelectorAll(".translation-popup").forEach(p => p.remove());

  const pop = document.createElement("div");
  pop.className = "translation-popup";
  pop.textContent = text;
  document.body.appendChild(pop);

  const r = targetEl.getBoundingClientRect();
  pop.style.left = `${r.left + window.scrollX}px`;
  pop.style.top  = `${r.bottom + window.scrollY + 6}px`;

  requestAnimationFrame(() => pop.classList.add("show"));

  setTimeout(() => {
    pop.classList.remove("show");
    setTimeout(() => pop.remove(), 200);
  }, 2500);
}

  /* =========================
     BOOT
     ========================= */
  loadData()
    .then(initPlayer)
    .catch(err => {
      console.error(err);
      statusEl.textContent = err.message;
    });

  // =========================
// WORD CLICK: TTS + TRANSLATION
// =========================
document.addEventListener("click", (e) => {
  const el = e.target.closest(".word[data-raw]");
  if (!el) return;

  // nie przerywaj wideo

  const raw = decodeURIComponent(el.dataset.raw || "");
  if (!raw) return;

  const currentSentence = segments[iSeg]?.text || "";

  // 1️⃣ TTS
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(raw);
    u.lang = "en-US";
    speechSynthesis.speak(u);
  } catch {}

  // 2️⃣ tłumaczenie (tymczasowo: console)
  translateWord(raw, currentSentence, el);
});


})();
