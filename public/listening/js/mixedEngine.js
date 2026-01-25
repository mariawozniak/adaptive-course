(() => {
  "use strict";

  const registry = {};

  const engine = {
    data: null,
    CORE: null,

    register(type, handler) {
      registry[type] = handler;
    },

    init(data, CORE) {
      this.data = data;
      this.CORE = CORE;

      // === MAX SCORE (1:1 z monolitu) ===
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
  const seg = this.data.segments[index];
  const handler = registry[seg.type];

  if (!handler) {
    console.warn(`No mixed handler for type: ${seg.type}`);
    return;
  }

  // 🔥 KLUCZOWE
  this.CORE.showOverlay();

  handler.render(seg, this.CORE);
},


    onNext(index) {
      const seg = this.data.segments[index];
      const handler = registry[seg.type];

      if (!handler) return true;
      return handler.onNext(seg, this.CORE);
    }
  };

  window.mixedEngine = engine;
})();
