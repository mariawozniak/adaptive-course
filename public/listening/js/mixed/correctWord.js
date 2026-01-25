(() => {
  const engine = window.mixedEngine;
  if (!engine) return;

  engine.register("correct-word", {
    phase: "edit",
    clicked: null,
    inputValue: "",

    render(seg, CORE) {
      this.phase = "edit";
      this.clicked = null;
      this.inputValue = "";

      const instr = document.getElementById("instruction");
      const q = document.getElementById("qtext");

      instr.textContent = seg.instruction || "Kliknij i popraw błędne słowo.";
      instr.style.display = "block";
      q.innerHTML = "";

      seg.sentence.forEach(word => {
        const span = document.createElement("span");
        span.textContent = word;
        span.style.marginRight = "10px";
        span.style.cursor = "pointer";

        span.onclick = () => {
          if (this.phase !== "edit") return;

          q.querySelectorAll(".edit-box").forEach(e => e.remove());
          q.querySelectorAll("span").forEach(s => {
            s.style.background = "transparent";
            s.style.color = "#fff";
          });

          span.style.background = "#ffd257";
          span.style.color = "#000";
          this.clicked = word;

          const box = document.createElement("span");
          box.className = "edit-box";
          box.innerHTML = `<input class="edit-input" type="text" />`;

          const input = box.querySelector("input");
          input.oninput = e => {
            this.inputValue = e.target.value.trim();
          };

          span.after(box);
          input.focus();
        };

        q.appendChild(span);
      });
    },

    onNext(seg, CORE) {
      const q = document.getElementById("qtext");

      /* === FAZA 1: FEEDBACK === */
      if (this.phase === "edit") {
        if (!this.clicked) return false;

        const isCorrect = this.inputValue.toLowerCase() === seg.correct.toLowerCase();

        if (isCorrect) {
          CORE.setScore(1);
        }

        q.innerHTML = `
          <div>
            ${seg.sentence.map(w => {
              if (w === seg.wrong) {
                return `<span class="green">${seg.correct}</span>`;
              }
              if (w === this.clicked) {
                return `<span class="red">${this.inputValue || "—"}</span>`;
              }
              return w;
            }).join(" ")}
          </div>
        `;

        this.phase = "feedback";
        return false;
      }

      /* === FAZA 2: DALEJ === */
      this.phase = "edit";
      this.clicked = null;
      this.inputValue = "";
      return true;
    }
  });
})();
