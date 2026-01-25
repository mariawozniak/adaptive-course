(() => {
  const engine = window.mixedEngine;
  if (!engine) return;

  engine.register("order", {
  render(seg, CORE) {
  const instr = document.getElementById("instruction");
  const q = document.getElementById("qtext");

  instr.textContent = seg.instruction || "Ułóż zdanie.";

  let top = [];
  let bottom = [...seg.words].sort(() => Math.random() - 0.5);

  const render = () => {
    q.innerHTML = "";

    const zone = document.createElement("div");
    zone.className = "order-zone";

    const topRow = document.createElement("div");
    topRow.className = "order-row";

    const bottomRow = document.createElement("div");
    bottomRow.className = "order-row";

    top.forEach((w, i) => {
      const el = document.createElement("div");
      el.className = "order-word selected";
      el.textContent = w;
      el.onclick = () => {
        top.splice(i, 1);
        bottom.push(w);
        render();
      };
      topRow.appendChild(el);
    });

    bottom.forEach((w, i) => {
      const el = document.createElement("div");
      el.className = "order-word";
      el.textContent = w;
      el.onclick = () => {
        bottom.splice(i, 1);
        top.push(w);
        render();
      };
      bottomRow.appendChild(el);
    });

    zone.appendChild(topRow);
    zone.appendChild(bottomRow);
    q.appendChild(zone);
  };

  render();

  document.getElementById("next").onclick = () => {
    if (top.join(" ") === seg.correct.join(" ")) {
      CORE.setScore(1);
    }
    CORE.hideOverlay();
    CORE.playSegment(CORE.getCurrentSegmentIndex() + 1);
  };
}
  });
})();
