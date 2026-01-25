(() => {
  "use strict";

  let selectedIndex = null;
  let phase = "select"; // select → result

  function render(seg, CORE) {
    selectedIndex = null;
    phase = "select";

    const instr = document.getElementById("instruction");
    const q = document.getElementById("qtext");

    instr.textContent = seg.instruction || "Wskaż zbędne słowo.";
    instr.style.display = "block";

    q.innerHTML = "";

    seg.sentence.forEach((word, index) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.style.marginRight = "8px";
      span.style.cursor = "pointer";
      span.style.padding = "4px 6px";
      span.style.borderRadius = "6px";

      span.onclick = () => {
        if (phase !== "select") return;

        selectedIndex = index;

        [...q.children].forEach(el => {
          el.style.background = "transparent";
          el.style.color = "#fff";
        });

        span.style.background = "#ffd257";
        span.style.color = "#000";
      };

      q.appendChild(span);
    });

    document.getElementById("answers").innerHTML = "";
    CORE.showOverlay();
  }



function onNext(seg, CORE) {
  // FAZA 1 – pokaż feedback
  if (phase === "select") {
    if (selectedIndex === null) return false;

    const q = document.getElementById("qtext");

    // 🔥 znajdź KONKRETNE zbędne wystąpienie
    const extraIndex = seg.sentence.findIndex(
      (w, i) => w === seg.extra && i !== selectedIndex
    );

    [...q.children].forEach((el, i) => {
      // 🟢 poprawne zbędne słowo
      if (i === extraIndex) {
        el.style.background = "#35c28d";
        el.style.color = "#000";
      }
      // 🟡 kliknięte przez użytkownika (błędne)
      else if (i === selectedIndex) {
        el.style.background = "#ffd257";
        el.style.color = "#000";
      }
      // reszta
      else {
        el.style.background = "transparent";
        el.style.color = "#fff";
      }
    });

    if (selectedIndex === extraIndex) {
      CORE.setScore(1);
    }

    phase = "result";
    return false; // ⛔ pokazaliśmy feedback
  }

  // FAZA 2 – przejście dalej
  phase = "select";
  selectedIndex = null;

  CORE.hideOverlay();
  return true;
}



  window.mixedEngine.register("extra-word", { render, onNext });
})();
