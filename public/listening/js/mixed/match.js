(() => {
  const engine = window.mixedEngine;
  if (!engine) return;

  engine.register("match", {
    phase: "select",
    pairs: [],

    render(seg, CORE) {
      this.phase = "select";
      this.pairs = seg.pairs.map(p => ({ ...p, chosen: null }));

      const instr = document.getElementById("instruction");
      const q = document.getElementById("qtext");

      instr.textContent = seg.instruction || "Połącz elementy.";
      instr.style.display = "block";
      q.innerHTML = "";

      const pool = [...this.pairs].map(p => p.right).sort(() => Math.random() - 0.5);

      this.pairs.forEach(pair => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "12px";

        const left = document.createElement("button");
        left.textContent = pair.left;

        const right = document.createElement("button");
        right.textContent = "—";

        left.onclick = () => {
          if (this.phase !== "select") return;
          const word = pool.find(w => !this.pairs.some(p => p.chosen === w));
          if (!word) return;
          pair.chosen = word;
          right.textContent = word;
        };

        row.appendChild(left);
        row.appendChild(right);
        q.appendChild(row);
      });
    },

    onNext(seg, CORE) {
      if (this.phase === "select") {
        if (this.pairs.some(p => !p.chosen)) return false;

        const correct = this.pairs.every(p => p.chosen === p.right);
        if (correct) CORE.setScore(1);

        this.phase = "feedback";
        return false;
      }

      this.phase = "select";
      this.pairs = [];
      return true;
    }
  });
})();
