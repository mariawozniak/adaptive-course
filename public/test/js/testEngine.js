(() => {
  const params = new URLSearchParams(location.search);
  const moduleName = params.get("module") || "module_1";
  const app = document.getElementById("app");

  let data;
  let index = 0;
  let revealed = false;

  async function loadData() {
    const mod = await import(`./data/${moduleName}.js`);
    data = mod.default;
  }

  function render() {
    const item = data.items[index];

    app.innerHTML = `
      <div style="max-width:600px;margin:40px auto;font-family:Arial">
        <h2>${item.front}</h2>

        ${revealed ? `
          <p><strong>${item.back}</strong></p>
          ${item.example ? `<p style="color:#666">${item.example}</p>` : ""}
        ` : ""}

        <button id="btn">
          ${revealed ? "Dalej ▶" : "Pokaż"}
        </button>
      </div>
    `;

    document.getElementById("btn").onclick = onClick;
  }

  function onClick() {
    if (!revealed) {
      revealed = true;
      render();
      return;
    }

    index++;
    revealed = false;

    if (index < data.items.length) {
      render();
    } else {
      finish();
    }
  }

  async function finish() {
    app.innerHTML = `<h2 style="text-align:center">Gotowe ✅</h2>`;

    await fetch("/api/lesson-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: data.moduleId,
        lessonId: data.lessonId
      })
    });
  }

  loadData().then(render);
})();
