(() => {
  "use strict";

  const engine = {
    data: null,
    CORE: null,
    current: 0,

    init(data, CORE) {
      this.data = data;
      this.CORE = CORE;
      this.current = 0;

      // ===== maxScore (1:1 z monolitu) =====
      const total = data.segments.reduce((sum, seg) => {
        if (seg.type === "extra-word") return sum + 1;
        if (seg.type === "mcq") return sum + 1;
        if (seg.type === "order") return sum + 1;
        if (seg.type === "match") return sum + 1;
        if (!seg.parts) return sum;
        return sum + seg.parts.filter(p => p.gap).length;
      }, 0);

      CORE.setMaxScore(total);
    },

    onSegmentEnd(index) {
      this.current = index;
      const seg = this.data.segments[index];

      // 🚦 dispatcher — NA RAZIE PUSTY
      // TU BĘDZIEMY PODPINAĆ mini-engines
      console.log("MIXED segment:", seg.type);

      // tymczasowo: stop
      this.CORE.showOverlay();
    }
  };

  window.mixedEngine = engine;
})();
