// /listening/js/gapfillEngine.js
// Gap Fill Engine — działa w 2 trybach:
// A) z core API (preferowane): core steruje YT i wywołuje engine.onSegmentEnd()
// B) fallback (jeśli core nie ma YT): engine sam tworzy YT i steruje segmentami
//
// Minimalne wymagania HTML: elementy z id: yt, overlay, qtext, instruction, msg, next, replayBtn, scoreBox

(function () {
  "use strict";

  // =========================
  // STATE
  // =========================
  let segments = [];
  let current = 0;
  let showedAnswers = false;

  let score = 0;
  let maxScore = 0;

  // core API (opcjonalne)
  let api = null;

  // fallback YT (tylko gdy core nie dostarcza api.playSegment)
  let player = null;
  let watcher = null;
  let ytReady = false;
  let videoId = null;

  // =========================
  // DOM HELPERS
  // =========================
  const $ = (id) => document.getElementById(id);

  function setText(id, txt) {
    const el = $(id);
    if (el) el.textContent = txt;
  }

  function showOverlay() {
    if (api?.showOverlay) return api.showOverlay();
    const ov = $("overlay");
    if (ov) ov.style.display = "flex";
  }

  function hideOverlay() {
    if (api?.hideOverlay) return api.hideOverlay();
    const ov = $("overlay");
    if (ov) ov.style.display = "none";
  }

  function normalize(s) {
    return (s ?? "").toString().trim().toLowerCase();
  }

  function escapeHtml(str) {
    return (str ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // =========================
  // DATA PREP
  // =========================
  function hydrateSegments(rawSegments) {
    return (rawSegments || []).map(seg => ({
      start: Number(seg.start ?? 0),
      end: Number(seg.end ?? 0),
      parts: (seg.parts || []).map(p => {
        if (!p?.gap) return { text: p?.text ?? "", gap: false };
        return {
          text: p.text ?? "",
          gap: true,
          userAnswer: p.userAnswer ?? "",
          isCorrect: p.isCorrect ?? null
        };
      })
    }));
  }

  function computeMaxScore(segs) {
    let n = 0;
    segs.forEach(seg => seg.parts.forEach(p => { if (p.gap) n++; }));
    return n;
  }

  function updateScoreBox() {
    // jeśli core ogarnia scorebox, użyj core
    if (api?.updateScoreBox) return api.updateScoreBox();

    const sb = $("scoreBox");
    if (sb) sb.textContent = `${score} / ${maxScore}`;
  }

  // =========================
  // RENDER
  // =========================
  function renderParts(parts) {
    const frag = document.createDocumentFragment();

    parts.forEach(p => {
      if (!p.gap) {
        const span = document.createElement("span");
        span.textContent = (p.text || "") + " ";
        frag.appendChild(span);
        return;
      }

      const wrap = document.createElement("span");
      wrap.className = "gap";

      const input = document.createElement("input");
      input.placeholder = "…";
      input.value = p.userAnswer || "";
      input.dataset.answer = p.text || "";

      input.addEventListener("input", e => {
        p.userAnswer = e.target.value;
      });

      // Enter = Next (tylko gdy overlay widoczny)
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          e.preventDefault();
          onNext();
        }
      });

      wrap.appendChild(input);
      frag.appendChild(wrap);
      frag.appendChild(document.createTextNode(" "));
    });

    return frag;
  }

  function renderEvaluation(parts) {
    const frag = document.createDocumentFragment();

    parts.forEach(p => {
      if (!p.gap) {
        const span = document.createElement("span");
        span.textContent = (p.text || "") + " ";
        frag.appendChild(span);
        return;
      }

      const wrap = document.createElement("span");
      wrap.className = "gap";

      const correctText = p.text || "";
      const userText = (p.userAnswer ?? "").toString().trim() || "—";

      if (p.isCorrect === true) {
        wrap.innerHTML = `<span style="color:#35c28d">${escapeHtml(correctText)}</span>`;
      } else {
        wrap.innerHTML =
          `<span style="color:#ff6b6b">${escapeHtml(userText)}</span> → ` +
          `<span style="color:#35c28d">${escapeHtml(correctText)}</span>`;
      }

      frag.appendChild(wrap);
      frag.appendChild(document.createTextNode(" "));
    });

    return frag;
  }

  function renderQuestion() {
    if (!segments.length) return;

    const seg = segments[current];
    const q = $("qtext");
    if (!q) return;

    q.innerHTML = "";

    const wasChecked = seg.parts.some(p => p.gap && p.isCorrect !== null);
    q.appendChild(wasChecked ? renderEvaluation(seg.parts) : renderParts(seg.parts));

    setText("instruction", "Uzupełnij luki.");
    setText("msg", "");

    showOverlay();

    // focus na pierwszą lukę
    setTimeout(() => {
      const first = q.querySelector("input");
      if (first) first.focus();
    }, 0);
  }

  // =========================
  // CHECK / NEXT
  // =========================
  function gradeCurrentSegment() {
    const seg = segments[current];
    if (!seg) return;

    seg.parts.forEach(p => {
      if (!p.gap) return;
      if (p.isCorrect !== null) return; // ocenione wcześniej

      const ok = normalize(p.userAnswer) === normalize(p.text);
      p.isCorrect = ok;

      if (ok) {
        if (api?.setScore) api.setScore(1);
        else score += 1;
      }
    });

    updateScoreBox();
  }

  function onNext() {
    if (!segments.length) return;

    // 1) Oceń (tylko raz na segment)
    gradeCurrentSegment();

    // 2) Pierwsze kliknięcie: pokaż odpowiedzi, zostań
    if (!showedAnswers) {
      showedAnswers = true;
      renderQuestion();
      return;
    }

    // 3) Drugie kliknięcie: przejdź dalej
    showedAnswers = false;
    hideOverlay();
    current++;

    if (current < segments.length) {
      playSegment(current);
    } else {
      // koniec
      if (api?.finishExercise) api.finishExercise();
      else {
        // fallback: prosty komunikat
        alert(`Koniec 🎉 Wynik: ${score} / ${maxScore}`);
      }
    }
  }

  function onReplay() {
    hideOverlay();
    playSegment(current);
  }

  // =========================
  // PLAY SEGMENT
  // =========================
  function playSegment(index) {
    if (!segments[index]) return;

    // preferujemy core
    if (api?.playSegment) {
      api.playSegment(index);
      return;
    }

    // fallback YT
    if (!player || !ytReady) {
      // jeśli YT jeszcze nie gotowe, spróbuj ponownie za chwilę
      setTimeout(() => playSegment(index), 100);
      return;
    }

    const seg = segments[index];

    player.seekTo(seg.start, true);
    player.playVideo();

    if (watcher) clearInterval(watcher);
    watcher = setInterval(() => {
      if (!player) return;
      if (player.getCurrentTime() >= seg.end) {
        clearInterval(watcher);
        watcher = null;
        player.pauseVideo();
        onSegmentEnd();
      }
    }, 200);
  }

  function onSegmentEnd() {
    // core może wołać to po zatrzymaniu fragmentu
    renderQuestion();
  }

  // =========================
  // FALLBACK: YOUTUBE INIT
  // =========================
  function ensureYouTubeFallback() {
    // jeśli core zapewnia odtwarzanie, nie tworzymy własnego playera
    if (api?.playSegment) return;
    if (!videoId) {
      console.warn("GapFillEngine: brak videoId w data, a core nie dostarcza playSegment().");
      return;
    }

    // jeśli YT już zainicjalizowane, nic nie rób
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    // załaduj API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    // zachowaj ewentualny poprzedni handler
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === "function") prev();
      createPlayer();
    };
  }

  function createPlayer() {
    if (player) return;
    const mount = $("yt");
    if (!mount) {
      console.error("GapFillEngine: brak #yt w HTML.");
      return;
    }

    player = new YT.Player("yt", {
      videoId: videoId,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: () => {
          ytReady = true;
          // start od 0 segmentu automatycznie (żeby nie było czarnego ekranu)
          playSegment(0);
        },
        onStateChange: (event) => {
          // jak film się skończy, też kończymy ćwiczenie
          if (event.data === YT.PlayerState.ENDED) {
            if (api?.finishExercise) api.finishExercise();
            else alert(`Koniec 🎉 Wynik: ${score} / ${maxScore}`);
          }
        }
      }
    });
  }

  // =========================
  // INIT
  // =========================
  function init(data, coreApi) {
    api = coreApi || null;

    // dane
    segments = hydrateSegments(data?.segments || []);
    current = 0;
    showedAnswers = false;

    // score: jeśli core liczy wynik, to i tak scoreBox aktualizuje core
    maxScore = data?.maxScore ?? computeMaxScore(segments);
    score = 0;
    updateScoreBox();

    // videoId dla fallbacku
    videoId = data?.videoId || data?.video_id || data?.youtubeId || null;

    // podpinamy przyciski (bezpiecznie — nadpisujemy onclick, więc bez dubli)
    const nextBtn = $("next");
    if (nextBtn) nextBtn.onclick = onNext;

    const replayBtn = $("replayBtn");
    if (replayBtn) replayBtn.onclick = onReplay;

    // fallback YT, jeżeli core jeszcze nie steruje playerem
    ensureYouTubeFallback();

    // jeśli core steruje playerem, to core powinien odpalić playSegment(0)
    // ale jako zabezpieczenie: jeśli core ma api.playSegment, spróbujmy wystartować po krótkim ticku
    if (api?.playSegment) {
      setTimeout(() => {
        try { api.playSegment(0); } catch (_) {}
      }, 0);
    }
  }

  // =========================
  // EXPORT
  // =========================
  window.GapFillEngine = {
    init,
    onNext,
    onReplay,
    onSegmentEnd,
    render: renderQuestion
  };

})();
