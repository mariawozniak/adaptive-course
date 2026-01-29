// public/listening/js/quizEngine.js
(() => {
  "use strict";

  const engine = {
    data: null,
    CORE: null,

    state: {
      current: 0,
      selected: false,
      phase: "answer" // answer | explanation
    },

    init(data, CORE_API){
      this.data = data;
      this.CORE = CORE_API;

      this.cacheDom();
    },

    cacheDom(){
      this.overlay = document.getElementById("overlay");
      this.qtext = document.getElementById("qtext");
      this.answersBox = document.getElementById("answers");
      this.instruction = document.getElementById("instruction");
      this.nextBtn = document.getElementById("next");
      this.replayBtn = document.getElementById("replayBtn");
    },



    onSegmentEnd(index){
      this.state.current = index;
      this.renderMCQ(this.data.segments[index]);
      this.CORE.showOverlay();
    },

    renderMCQ(seg){
      this.state.selected = false;
      this.state.phase = "answer";

      this.instruction.textContent = "Pytanie";
      this.qtext.textContent = seg.question;

      this.answersBox.innerHTML = "";
      this.answersBox.style.display = "block";

      seg.answers.forEach(ans => {
        const div = document.createElement("div");
        div.className = "answer";
        div.textContent = ans.text;

        div.onclick = () => {
          if (this.state.selected) return;
          this.state.selected = true;

          if (ans.correct){
            div.classList.add("correct");
            this.CORE.setScore(1);
          } else {
            div.classList.add("wrong");
            [...this.answersBox.children].forEach(el => {
              const correct = seg.answers.find(a => a.correct && a.text === el.textContent);
              if (correct) el.classList.add("correct");
            });
          }
        };

        this.answersBox.appendChild(div);
      });
    },

  onNext(){
  const seg = this.data.segments[this.state.current];
  if (!this.state.selected) return false;

  if (this.state.phase === "answer"){
    this.answersBox.style.display = "none";
    this.qtext.textContent = seg.explanation || "";
    this.instruction.textContent = "Wyjaśnienie";
    this.state.phase = "explanation";
    return false; // ⛔ NIE przechodź dalej
  }

  // phase === explanation
  return true; // ✅ core może iść do nextSegment
},

    onReplay(){
      this.CORE.hideOverlay();
      this.CORE.playSegment(this.state.current);
    }
  };

  window.quizEngine = engine;
})();
