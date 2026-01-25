(() => {
  const engine = window.mixedEngine;
  if (!engine) return;

  engine.register("order", {
    phase: "arrange",
    top: [],
    bottom: [],

    render(seg, CORE) {
      this.phase = "arrange";
      this.top = [];
      this.bottom = [...seg.words].sort(() => Math.random() - 0.5);

      const instr = document.getElementById("instruction");
      const q = document.getElementById("qtext");

      instr.textContent = seg.instruction || "Ułóż zdanie.";
      instr.style.display = "block";

      const renderUI = () => {
        q.innerHTML = "";

        const topRow = document.createElement("div");
        topRow.className = "order-row";

        const bottomRow = document.createElement("div");
        bottomRow.className = "order-row";

        // GÓRA – wybrane słowa
        this.top.forEach((word, index) => {
          const el = document.createElement("div");
          el.className = "order-word selected";
          el.textContent = word;

          el.onclick = () => {
            if (this.phase !== "arrange") return;
            this.top.splice(index, 1);
            this.bottom.push(word);
            renderUI();
          };

          topRow.appendChild(el);
        });

        // DÓŁ – do wyboru
        this.bottom.forEach((word, index) => {
          const el = document.createElement("div");
          el.className = "order-word";
          el.textContent = word;

          el.onclick = () => {
            if (this.phase !== "arrange") return;
            this.bottom.splice(index, 1);
            this.top.push(word);
            renderUI();
          };

          bottomRow.appendChild(el);
        });

        q.appendChild(topRow);
        q.appendChild(bottomRow);
      };

      renderUI();
    },

    onNext(seg, CORE) {
      const q = document.getElementById("qtext");

      /* ===== FAZA 1: FEEDBACK ===== */
      if (this.phase === "arrange") {
        if (this.top.length !== seg.correct.length) return false;

        q.innerHTML = "";
        document.getElementById("instruction").style.display = "none";

        const isCorrect = this.top.join(" ") === seg.correct.join(" ");

        const title = document.createElement("div");
        title.textContent = isCorrect ? "✓ Dobrze!" : "✗ Źle";
        title.style.cssText = `
          font-size:22px;
          font-weight:700;
          margin-bottom:14px;
          color:${isCorrect ? "#35c28d" : "#ff6b6b"};
        `;
        q.appendChild(title);

        const userRow = document.createElement("div");
        this.top.forEach(word => {
          const s = document.createElement("span");
          s.textContent = word;
          s.style.cssText = `
            padding:8px 12px;
            margin:6px;
            border-radius:10px;
            font-weight:700;
            display:inline-block;
            background:${isCorrect ? "#35c28d" : "#ff6b6b"};
            color:#000;
          `;
          userRow.appendChild(s);
        });
        q.appendChild(userRow);

        if (!isCorrect) {
          const correctRow = document.createElement("div");
          correctRow.style.cssText = `
            margin-top:14px;
            font-size:18px;
            font-weight:700;
            color:#35c28d;
          `;
          correctRow.textContent = seg.correct.join(" ");
          q.appendChild(correctRow);
        } else {
          CORE.setScore(1);
        }

        this.phase = "feedback";
        return false; // ⛔ nie przechodź dalej
      }

      /* ===== FAZA 2: DALEJ ===== */
      this.phase = "arrange";
      this.top = [];
      this.bottom = [];
      return true; // ✅ CORE przechodzi do następnego segmentu
    }
  });
})();
