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
      if (this.phase === "edit") {
        const user = this.inputValue || "";
        const isCorrect = user.toLowerCase() === seg.correct.toLowerCase();

        const q = document.getElementById("qtext");
        q.innerHTML = `
          <div class="feedback-block">
            ${seg.sentence.map(w => {
              if (w === seg.wrong) {
                return `
                  <span class="red">(${w})</span>
                  <span class="${isCorrect ? "green" : "red"}"> ${user || "—"}</span>
                  ${!isCorrect ? ` → <span class="green">${seg.correct}</span>` : ""}
                `;
              }
              return `<span>${w}</span>`;
            }).join(" ")}
          </div>
        `;

        if (isCorrect) CORE.setScore(1);
        this.phase = "result";
        return false;
      }

      this.phase = "edit";
      return true;
    },

    reset() {
      this.phase = "edit";
      this.clicked = null;
      this.inputValue = "";
    }
  });
})();
