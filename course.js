import { modules } from "../data/modules.js";

const app = document.getElementById("app");

// bierzemy pierwszy moduł
const module = modules[0];

app.innerHTML = `
  <h1>${module.title}</h1>

  <iframe
    width="100%"
    height="315"
    src="https://www.youtube.com/embed/${module.videoId}"
    frameborder="0"
    allowfullscreen
  ></iframe>

  <h2>Słówka</h2>
  <ul>
    ${module.vocabulary.words
      .map(word => `<li>${word.en} — ${word.pl}</li>`)
      .join("")}
  </ul>
`;
