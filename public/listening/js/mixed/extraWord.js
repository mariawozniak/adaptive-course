(() => {
  "use strict";

  let selected = null;
  let phase = "select"; // select → result

  function render(seg, CORE) {
    selected = null;
    phase = "select";

    const instr = document.getElementById("instruction");
    const q = document.getElementById("qtext");

    instr.textContent = seg.instruction || "Wskaż zbędne słowo.";
    instr.style.display = "block";

    q.innerHTML = "";

    seg.sentence.forEach(word => {
      const span = document.createElement("span");
      span.textContent = word;
      span.style.marginRight = "8px";
      span.style.cursor = "pointer";
      span.style.padding = "4px 6px";
      span.style.borderRadius = "6px";

      span.onclick = () => {
        if (phase !== "select") return;

        [...q.children].forEach(el => {
          el.style.background = "transparent";
          el.style.color = "#fff";
        });

        span.style.background = "#ffd257";
        span.style.color = "#000";
        selected = word;
      };

      q.appendChild(span);
    });

    document.getElementById("answers").innerHTML = "";
    CORE.showOverlay();
  }

  function onNext(seg, CORE) {
    if (phase === "select") {
      if (!selected) return false;

      const q = document.getElementById("qtext");
      [...q.children].forEach(el => {
        if (el.textContent === seg.extra) {
          el.style.background = "#35c28d";
          el.style.color = "#000";
        } else if (el.textContent === selected) {
          el.style.background = "#ffd257";
          el.style.color = "#000";
        } else {
          el.style.background = "transparent";
          el.style.color = "#fff";
        }
      });

      if (selected === seg.extra) {
        CORE.setScore(1);
      }

      phase = "result";
      return false;
    }

    CORE.hideOverlay();
    return true;
  }

  window.mixedEngine.register("extra-word", { render, onNext });
})();
