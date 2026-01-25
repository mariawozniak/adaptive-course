(() => {
  "use strict";

  /* =========================
     PARAMS + ROOT
     ========================= */
  const params = new URLSearchParams(window.location.search);
  const moduleName = params.get("module") || "module_1";
  const app = document.getElementById("app");

  /* =========================
     STATE
     ========================= */
  let data = null;
  let currentIndex = 0;
  let score = 0;
  let answered = false;

  /* =========================
     DATA LOADING
     ========================= */
  async function loadData() {
    const res = await fetch(`/data/test/${moduleName}.test.json`)

      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Nie można załadować danych testu");
    }

    data = await res.json();
  }

  /* =========================
     HELPERS
     ========================= */
  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  /* =========================
     RENDER QUESTION
     ========================= */
  function renderQuestion() {
    answered = false;

    const q = data.questions[currentIndex];
    const answers = shuffle(q.answers);

    app.innerHTML = `
      <div class="progress">
        Pytanie ${currentIndex + 1} / ${data.questions.length}
      </div>

      <div class="question">
        ${q.question}
      </div>

      <div class="answers">
        ${answers
          .map(
            a => `
          <div class="answer" data-correct="${a.correct}">
            ${a.text}
          </div>
        `
          )
          .join("")}
      </div>

      <div class="actions">
        <button id="nextBtn" disabled>Dalej ▶</button>
      </div>
    `;

    app.querySelectorAll(".answer").forEach(el => {
      el.addEventListener("click", () => onSelect(el, q));
    });

    document.getElementById("nextBtn").onclick = next;
  }

  /* =========================
     ANSWER SELECTION
     ========================= */
  function onSelect(el, question) {
    if (answered) return;
    answered = true;

    const isCorrect = el.dataset.correct === "true";
    if (isCorrect) score++;

    app.querySelectorAll(".answer").forEach(a => {
      const correct = a.dataset.correct === "true";
      a.classList.add(correct ? "correct" : "wrong");
    });

    if (question.comment) {
      const comment = document.createElement("div");
      comment.className = "comment";
      comment.textContent = question.comment;
      app.appendChild(comment);
    }

    document.getElementById("nextBtn").disabled = false;
  }

  /* =========================
     NEXT QUESTION
     ========================= */
  function next() {
    currentIndex++;

    if (currentIndex < data.questions.length) {
      renderQuestion();
    } else {
      finish();
    }
  }

  /* =========================
     FINISH TEST
     ========================= */
  async function finish() {
    app.innerHTML = `
      <div class="result">
        <h1>Koniec testu 🎉</h1>
        <div class="score">${score} / ${data.questions.length}</div>
        <p>Dobra robota!</p>
      </div>
    `;

    try {
      await fetch("/api/lesson-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: data.moduleId,
          lessonId: data.lessonId
        })
      });
    } catch (e) {
      console.error("Nie udało się zapisać ukończenia lekcji", e);
    }
  }

  /* =========================
     BOOTSTRAP
     ========================= */
  loadData()
    .then(renderQuestion)
    .catch(err => {
      console.error(err);
      app.innerHTML = `<p style="color:red">Błąd: ${err.message}</p>`;
    });
})();
