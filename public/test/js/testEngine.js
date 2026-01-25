
(() => {
  const params = new URLSearchParams(window.location.search);
  const moduleName = params.get("module") || "module_1";

  const app = document.getElementById("app");

  let data;
  let index = 0;
  let score = 0;
  let selected = false;

  async function loadData() {
    const res = await fetch(`/test/data/${moduleName}.test.json`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Nie można załadować testu");
    data = await res.json();
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function renderQuestion() {
    selected = false;
    const q = data.questions[index];
    const answers = shuffle(q.answers);

    app.innerHTML = `
      <div class="progress">Pytanie ${index + 1} / ${data.questions.length}</div>
      <div class="question">${q.question}</div>
      <div class="answers">
        ${answers.map((a, i) => `
          <div class="answer" data-correct="${a.correct}">
            ${a.text}
          </div>
        `).join("")}
      </div>
      <div class="actions">
        <button id="nextBtn" disabled>Dalej ▶</button>
      </div>
    `;

    app.querySelectorAll(".answer").forEach(el => {
      el.onclick = () => selectAnswer(el, q);
    });

    document.getElementById("nextBtn").onclick = next;
  }

  function selectAnswer(el, q) {
    if (selected) return;
    selected = true;

    const isCorrect = el.dataset.correct === "true";
    if (isCorrect) score++;

    app.querySelectorAll(".answer").forEach(a => {
      const correct = a.dataset.correct === "true";
      a.classList.add(correct ? "correct" : "wrong");
    });

    if (q.comment) {
      const c = document.createElement("div");
      c.className = "comment";
      c.textContent = q.comment;
      app.appendChild(c);
    }

    document.getElementById("nextBtn").disabled = false;
  }

  function next() {
    index++;
    if (index < data.questions.length) {
      renderQuestion();
    } else {
      finish();
    }
  }

  async function finish() {
    app.innerHTML = `
      <div class="result">
        <h1>Koniec testu 🎉</h1>
        <div class="score">${score} / ${data.questions.length}</div>
        <p>Dobra robota!</p>
      </div>
    `;

    await fetch("/api/lesson-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: data.moduleId,
        lessonId: data.lessonId
      })
    });
  }

  loadData()
    .then(renderQuestion)
    .catch(err => {
      app.textContent = err.message || "Błąd";
    });
})();
