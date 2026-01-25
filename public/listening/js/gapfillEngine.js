// public/listening/js/gapfillEngine.js
(() => {
  "use strict";

  const engine = {
    data: null,
    CORE: null,

    state: {
      currentSegment: 0,
      showedAnswers: false,
      answers: new Map() // key: part index, value: userAnswer
    },

    // ---- init ----
    init(data, CORE_API) {
      this.data = data;
      this.CORE = CORE_API;

      this.cacheDom();
      this.bindEvents();
    },

    cacheDom() {
      this.qtext = document.getElementById("qtext");
      this.overlay = document.getElementById("overlay");
      this.nextBtn = document.getElementById("next");
      this.replayBtn = document.getElementById("replayBtn");
      this.msg = document.getElementById("msg");
      this.instruction = document.getElementById("instruction");
    },

    bindEvents() {
      this.nextBtn.addEventListener("click", () => this.onNext());
      this.replayBtn.addEventListener("click", () => this.onReplay());

      document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && this.overlay.style.display === "flex") {
          e.preventDefault();
          this.onNext();
        }
      });
    },

    // ---- CORE → ENGINE ----
    onSegmentEnd(index) {
      this.state.currentSegment = index;
      this.state.showedAnswers = false;
      this.renderQuestion();
      this.CORE.showOverlay();
    },

    // ---- rendering ----
    renderQuestion() {
      const seg = this.data.segments[this.state.currentSegment];
      this.qtext.innerHTML = "";

      if (this.state.showedAnswers) {
        this.qtext.appendChild(this.renderEvaluation(seg));
      } else {
        this.qtext.appendChild(this.renderInputs(seg));
      }

      if (this.msg) this.msg.textContent = "";
      if (this.instruction) this.instruction.style.display = "block";
    },

    renderInputs(seg) {
      const frag = document.createDocumentFragment();

      seg.parts.forEach((p, idx) => {
        if (!p.gap) {
          frag.appendChild(document.createTextNode(p.text + " "));
        } else {
          const span = document.createElement("span");
          span.className = "gap";

          const input = document.createElement("input");
          input.placeholder = "…";
          input.value = this.state.answers.get(idx) || "";
          input.dataset.answer = p.text;
          input.dataset.partIndex = idx;

          input.addEventListener("input", (e) => {
            this.state.answers.set(idx, e.target.value);
          });

          span.appendChild(input);
          frag.appendChild(span);
          frag.appendChild(document.createTextNode(" "));
        }
      });

      return frag;
    },

    renderEvaluation(seg) {
      const frag = document.createDocumentFragment();

      seg.parts.forEach((p, idx) => {
        if (!p.gap) {
          frag.appendChild(document.createTextNode(p.text + " "));
        } else {
          const span = document.createElement("span");
          span.className = "gap";

          const user = (this.state.answers.get(idx) || "").trim();
          const correct = p.text;

          if (user.toLowerCase() === correct.toLowerCase()) {
            span.innerHTML = `<span class="gap--correct">${correct}</span>`;
          } else {
            span.innerHTML =
              `<span class="gap--wrong">${user || "—"}</span> → ` +
              `<span class="gap--correct">${correct}</span>`;
          }

          frag.appendChild(span);
          frag.appendChild(document.createTextNode(" "));
        }
      });

      return frag;
    },

    // ---- actions ----
    onNext() {
      const seg = this.data.segments[this.state.currentSegment];

      // 1️⃣ pierwsze kliknięcie → sprawdzenie
      if (!this.state.showedAnswers) {
        this.checkAnswers(seg);
        this.state.showedAnswers = true;
        this.renderQuestion();
        return;
      }

      // 2️⃣ drugie kliknięcie → dalej
      this.CORE.hideOverlay();
      this.state.answers.clear();
      this.state.showedAnswers = false;

      const nextIndex = this.state.currentSegment + 1;

      if (nextIndex < this.data.segments.length) {
        this.CORE.playSegment(nextIndex);
      } else {
        this.CORE.finishExercise();
      }
    },

    onReplay() {
      this.CORE.hideOverlay();
      this.CORE.playSegment(this.state.currentSegment);
    },

    checkAnswers(seg) {
      seg.parts.forEach((p, idx) => {
        if (!p.gap) return;

        const user = (this.state.answers.get(idx) || "").trim();
        if (user.toLowerCase() === p.text.toLowerCase()) {
          this.CORE.setScore(1);
        }
      });
    }
  };

  // expose globally
  window.gapfillEngine = engine;
})();
