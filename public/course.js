import { modules } from "../data/modules.js";

const app = document.getElementById("app");
const module = modules[0];

let activeView = "video";

function render() {
  app.innerHTML = `
    <h1>${module.title}</h1>

    <div style="margin-bottom: 16px;">
      <button onclick="setView('video')">🎬 Wideo</button>
      <button onclick="setView('vocab')">📘 Słówka</button>
      <button onclick="setView('listening')">🎧 Listening</button>
      <button onclick="setView('shadowing')">🗣 Shadowing</button>
      <button disabled>🤖 AI</button>
    </div>

    <div id="content">
      ${renderView()}
    </div>
  `;
}

window.setView = (view) => {
  activeView = view;
  render();
};

function renderView() {
  if (activeView === "video") {
    return `
      <iframe
        width="100%"
        height="315"
        src="https://www.youtube.com/embed/${module.videoId}"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `;
  }

  if (activeView === "vocab") {
    return `
      <ul>
        ${module.vocabulary.words
          .map(w => `<li>${w.en} — ${w.pl}</li>`)
          .join("")}
      </ul>
    `;
  }

  if (activeView === "listening") {
    return `<p>🎧 Listening — w kolejnym kroku</p>`;
  }

  if (activeView === "shadowing") {
    return `<p>🗣 Shadowing — w kolejnym kroku</p>`;
  }

  return "";
}

render();
