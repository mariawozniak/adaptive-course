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

    sentenceEl.innerHTML = makeSentenceClickable(seg.text);
    sentenceEl.classList.remove("hidden");

    isPlayingVideoSegment = true;
    try { speechSynthesis.cancel(); } catch {}

    if (watcher) clearInterval(watcher);

    if (data.player.type === "youtube") {
      player.seekTo(seg.start, true);
      player.playVideo();

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

    function stop() {
      try { rec.stop(); } catch {}
      renderDiff(expectedText, transcript.trim());
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
      arm();
    };

    rec.onerror = () => stop();
    rec.onend   = () => stop();

    recInstance = rec;
    rec.start();
  }

  /* =========================
     DIFF RENDER
     ========================= */
  function renderDiff(expected, spoken) {
    statusEl.classList.remove("listening");

    if (!spoken) {
      statusEl.textContent = "Nic nie usłyszałem.";
      return;
    }

    statusEl.innerHTML = `Powiedziałeś: <b>${escapeHtml(spoken)}</b>`;
    sentenceEl.innerHTML = makeSentenceClickable(expected);
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

  /* =========================
     BOOT
     ========================= */
  loadData()
    .then(initPlayer)
    .catch(err => {
      console.error(err);
      statusEl.textContent = err.message;
    });

})();
