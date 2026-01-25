// /listening/js/gapfillEngine.js
// Engine typu: gap fill (uzupełnianie luk)
// UWAGA: ten plik NIE zna YouTube, fullscreen, end-screen.
// Komunikuje się wyłącznie przez "api" przekazane z core.js.

(function () {
  "use strict";

  // ====== STATE ======
  let segments = [];
  let current = 0;
  let showedAnswers = false;
  let api = null;

  // ====== HELPERS ======
  function $(id) {
    return document.getElementById(id);
  }

  function normalize(s) {
    return (s ?? "").toString().trim().toLowerCase();
  }

  function ensureGapState(data) {
    // Dodatkowe zabezpieczenie: jeśli JSON już ma userAnswer/isCorrect, nie psujemy tego
    return data.segments.map(seg => ({
      ...seg,
      parts: (seg.parts || []).map(p => {
        if (!p || typeof p !== "object") return p;
        if (!p.gap) return { ...p };
        return {
          ...p,
          userAnswer: p.userAnswer ?? "",
          isCorrect: p.isCorrect ?? null
        };
      })
    }));
  }

  // ====== RENDERING ======
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

      // UX: enter przechodzi dalej (ale tylko gdy overlay jest widoczny)
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

      // p.isCorrect jest booleanem (true/false) po sprawdzeniu
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

  function escapeHtml(str) {
    // Bezpieczne wstrzyknięcie tekstu w innerHTML (unikamy psucia layoutu)
    return (str ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    if (!segments.length) return;

    const seg = segments[current];
    const q = $("qtext");
    if (!q) return;

    q.innerHTML = "";

    const wasChecked = (seg.parts || []).some(p => p.gap && p.isCorrect !== null);

    if (wasChecked) q.appendChild(renderEvaluation(seg.parts || []));
    else q.appendChild(renderParts(seg.parts || []));

    const instruction = $("instruction");
    if (instruction) instruction.textContent = "Uzupełnij luki.";

    const msg = $("msg");
    if (msg) msg.textContent = "";

    if (api && typeof api.showOverlay === "function") api.showOverlay();
    else {
      // awaryjnie (gdyby core nie dawał api.showOverlay)
      const ov = $("overlay");
      if (ov) ov.style.display = "flex";
    }

    // UX: focus na pierwszy input jeśli istnieje
    setTimeout(() => {
      const first = q.querySelector("input");
      if (first) first.focus();
    }, 0);
  }

  // ====== CORE EVENTS ======
  function onSegmentEnd() {
    // Core mówi: "fragment się skończył, pokaż pytanie"
    render();
  }

  function onReplay() {
    // Ukryj overlay i odtwórz ten sam segment
    if (api && typeof api.hideOverlay === "function") api.hideOverlay();
    else {
      const ov = $("overlay");
      if (ov) ov.style.display = "none";
    }

    if (api && typeof api.playSegment === "function") {
      api.playSegment(current);
    }
  }

  function onNext() {
    if (!segments.length) return;

    const seg = segments[current];

    // 1) Sprawdź tylko te luki, które nie były jeszcze ocenione (isCorrect === null)
    (seg.parts || []).forEach(p => {
      if (!p.gap) return;
      if (p.isCorrect !== null) return;

      const ok = normalize(p.userAnswer) === normalize(p.text);
      p.isCorrect = ok;

      if (ok && api && typeof api.setScore === "function") {
        api.setScore(1);
      }
    });

    if (api && typeof api.updateScoreBox === "function") {
      api.updateScoreBox();
    }

    // 2) Pierwsze kliknięcie: pokaż ocenę, nie przechodź dalej
    if (!showedAnswers) {
      showedAnswers = true;
      render();
      return;
    }

    // 3) Drugie kliknięcie: przejdź do następnego segmentu
    showedAnswers = false;
    current++;

    if (api && typeof api.hideOverlay === "function") api.hideOverlay();
    else {
      const ov = $("overlay");
      if (ov) ov.style.display = "none";
    }

    if (current < segments.length) {
      // reset: kolejny segment ma być "czysty" na wejściu (ale userAnswer już jest w segmencie)
      if (api && typeof api.playSegment === "function") {
        api.playSegment(current);
      }
    } else {
      // koniec ćwiczenia
      if (api && typeof api.finishExercise === "function") {
        api.finishExercise();
      }
    }
  }

  // ====== INIT ======
  function init(data, coreApi) {
    api = coreApi || null;

    // Bezpieczne mapowanie danych
    if (!data || !Array.isArray(data.segments)) {
      console.error("GapFillEngine.init: brak data.segments");
      segments = [];
      current = 0;
      showedAnswers = false;
      return;
    }

    segments = ensureGapState(data);

    current = 0;
    showedAnswers = false;

    // Ustaw początkowy napis instrukcji (core może mieć pusty)
    const instruction = $("instruction");
    if (instruction) instruction.textContent = "Uzupełnij luki.";

    // UWAGA: nie odpalamy playSegment tutaj – to robi core, kiedy player gotowy
  }

  // ====== EXPORT ======
  window.GapFillEngine = {
    init,
    render,       // opcjonalnie (core może zawołać ręcznie)
    onNext,
    onReplay,
    onSegmentEnd
  };
})();
