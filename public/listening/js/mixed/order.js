(() => {
  const engine = window.mixedEngine;
  if (!engine) return;

  engine.register("order", {
    render(seg, CORE) {
      const instr = document.getElementById("instruction");
      const q = document.getElementById("qtext");

      instr.textContent = seg.instruction || "Ułóż zdanie.";
      q.innerHTML = "";

      let top = [];
      let bottom = [...seg.words].sort(() => Math.random() - 0.5);

      const render = () => {
        q.innerHTML = "";

        // TOP
        const topRow = document.createElement("div");
        top.forEach((w, i) => {
          const btn = document.createElement("button");
          btn.textContent = w;
          btn.onclick = () => {
            top.splice(i, 1);
            bottom.push(w);
            render();
          };
          topRow.appendChild(btn);
        });

        // BOTTOM
        const bottomRow = document.createElement("div");
        bottom.forEach((w, i) => {
          const btn = document.createElement("button");
          btn.textContent = w;
          btn.onclick = () => {
            bottom.splice(i, 1);
            top.push(w);
            render();
          };
          bottomRow.appendChild(btn);
        });

        q.appendChild(topRow);
        q.appendChild(bottomRow);
      };

      render();

      document.getElementById("next").onclick = () => {
        const ok = top.join(" ") === seg.correct.join(" ");
        if (ok) CORE.setScore(1);

        CORE.hideOverlay();
        CORE.playSegment(CORE.getCurrentSegmentIndex() + 1);
      };
    }
  });
})();
