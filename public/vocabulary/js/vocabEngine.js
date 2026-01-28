(async function () {

  const params = new URLSearchParams(window.location.search);
const moduleId = params.get("module") || "module_1";


  /* =======================
     ŁADOWANIE DANYCH MODUŁU
     ======================= */
const MODULE_PATH = `/data/vocabulary/${moduleId}.json`;

const response = await fetch(MODULE_PATH);
const moduleData = await response.json();
const words = moduleData.words.map((w, index) => ({
  ...w,
  _id: `${moduleId}_${index}`
}));
/* =======================
   STATUSY Z BACKENDU
   ======================= */

let vocabStatuses = {};

try {
  const res = await fetch(`/api/vocab/status?moduleId=${moduleId}`, {
    credentials: "include"
  });

  const data = await res.json();

  if (data.ok) {
    vocabStatuses = data.statuses || {};
  }
} catch (e) {
  console.warn("Nie udało się pobrać statusów vocabulary", e);
}


  /* =======================
     POMOCNICZE
     ======================= */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
function buildInitialQueue(words, statuses) {
  const learning = [];
  const fresh = [];
  const known = [];

  for (const w of words) {
    const status = statuses[w._id];

    if (status === "learning") {
      learning.push(w);
    } else if (status === "known") {
      known.push(w);
    } else {
      fresh.push(w); // brak statusu = nowe
    }
  }

  return [
    ...shuffleArray(learning),
    ...shuffleArray(fresh),
    ...shuffleArray(known)
  ];
}

  const KEY_FLASH = "flashcards-queue-m1";
  const KEY_PRACTICE = "practice-queue-m1";

  let frontLang = "en";
  let flipped = false;
  let queueFlashcards;
  let queuePractice;
  let currentCard = null;
  let selectedVoice = null;
  let practiceMode = false;

  /* =======================
     KOLEJKI (LOCALSTORAGE)
     ======================= */
  /*
  let savedFlash = localStorage.getItem(KEY_FLASH);
  if (savedFlash) {
    try { queueFlashcards = JSON.parse(savedFlash); }
    catch { queueFlashcards = shuffleArray([...words]); }
  } else {
    queueFlashcards = shuffleArray([...words]);
  }

  let savedPractice = localStorage.getItem(KEY_PRACTICE);
  if (savedPractice) {
    try { queuePractice = JSON.parse(savedPractice); }
    catch { queuePractice = shuffleArray([...words]); }
  } else {
    queuePractice = shuffleArray([...words]);
  } 
  */

  queueFlashcards = buildInitialQueue(words, vocabStatuses);

// practice na razie zostawiamy prosto
queuePractice = shuffleArray([...words]);


  function saveFlashcards() {
    localStorage.setItem(KEY_FLASH, JSON.stringify(queueFlashcards));
  }
  function savePractice() {
    localStorage.setItem(KEY_PRACTICE, JSON.stringify(queuePractice));
  }

  /* =======================
     SYNTEZA MOWY
     ======================= */
  function loadVoices() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) {
      setTimeout(loadVoices, 250);
      return;
    }
    selectedVoice = voices.find(v => /Google (US|UK) English/.test(v.name))
                  || voices.find(v => v.lang.startsWith("en"));
  }
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  /* =======================
     REFERENCJE DOM
     ======================= */
  const cardContainer = document.getElementById("card");
  const againBtn = document.getElementById("again-btn");
  const knowBtn = document.getElementById("know-btn");
  const message = document.getElementById("message");

  const menuBtn  = document.getElementById("menu-btn");
  const menuList = document.getElementById("menu-list");

  /* =======================
     MENU
     ======================= */
  function renderMenu() {
    if (practiceMode) {
      menuList.innerHTML = `
        <li data-action="flashcards">Fiszki</li>
        <li data-action="reset">Wyzeruj postęp fiszek</li>
        <li data-action="resetPractice">Wyzeruj postęp pisowni</li>
      `;
    } else {
      menuList.innerHTML = `
        <li data-action="flashcards">Fiszki</li>
        <li data-action="en">Angielski z przodu</li>
        <li data-action="pl">Polski z przodu</li>
        <li data-action="reset">Wyzeruj postęp fiszek</li>
        <li data-action="resetPractice">Wyzeruj postęp pisowni</li>
        <li data-action="practice">Ćwiczenie pisowni</li>
      `;
    }
  }

  /* =======================
     OBSŁUGA KARTY
     ======================= */
  cardContainer.addEventListener("click", (e) => {
    if (practiceMode) return;

    if (e.target.closest(".speak-btn")) {
      e.stopPropagation();
      const utterance = new SpeechSynthesisUtterance(currentCard.en);
      utterance.lang = "en-US";
      if (selectedVoice) utterance.voice = selectedVoice;
      speechSynthesis.speak(utterance);
      return;
    }

    flipped = !flipped;
    cardContainer.className = "flashcard" + (flipped ? " flipped" : "");
  });

  function renderCard() {
    practiceMode = false;
    document.querySelector(".nav-controls").style.display = "block";
    renderMenu();

    if (queueFlashcards.length === 0) {
      cardContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
          <div style="font-size:20px; font-weight:bold; margin-bottom:20px;">
            🎉 Gratulacje! Przerobiłeś wszystkie fiszki.
          </div>
          <button id="restart-btn" class="practice-btn">Zacznij od nowa</button>
        </div>
      `;
      document.getElementById("restart-btn").onclick = () => {
        queueFlashcards = shuffleArray([...words]);
        saveFlashcards();
        renderCard();
      };
      return;
    }

    currentCard = queueFlashcards[0];
    flipped = false;
    cardContainer.className = "flashcard";
    message.textContent = "";

    cardContainer.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          ${frontLang === "en" ? currentCard.en : currentCard.pl}
          ${frontLang === "en" ? `<button class="speak-btn">🔊</button>` : ""}
        </div>
        <div class="card-back">
          ${frontLang === "en" ? currentCard.pl : currentCard.en}
          ${frontLang === "pl" ? `<button class="speak-btn">🔊</button>` : ""}
        </div>
      </div>
    `;
  }

  function swipeCard(direction) {
    if (!currentCard) return;

    cardContainer.classList.add(direction === "left" ? "swipe-left" : "swipe-right");

    setTimeout(() => {
      if (direction === "left") {
        queueFlashcards.push(queueFlashcards.shift());
      } else {
        queueFlashcards.shift();
      }
      saveFlashcards();
      cardContainer.classList.remove("swipe-left", "swipe-right");
      renderCard();
    }, 400);
  }

  /* =======================
     GESTY
     ======================= */
  let startX = 0;
  cardContainer.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  cardContainer.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) swipeCard(diff > 0 ? "right" : "left");
  });

  /* =======================
     PRACTICE MODE
     ======================= */
  function renderPractice() {
    practiceMode = true;
    document.querySelector(".nav-controls").style.display = "none";
    renderMenu();

    if (queuePractice.length === 0) {
      cardContainer.innerHTML = "🎉 Gratulacje! Przerobiłeś wszystko.";
      return;
    }

    const item = queuePractice[0];
    cardContainer.innerHTML = `
      <div class="practice-container">
        <div class="practice-word">
          ${item.pl}
          <span id="idk" class="idk-link">Nie wiem</span>
        </div>
        <div class="typing-wrap">
          <div id="hl" class="highlighter"></div>
          <input id="answer" class="practice-input" placeholder="(ANGIELSKI)">
        </div>
        <div id="feedback" class="feedback"></div>
        <div style="text-align:right;margin-top:10px;">
          <button id="check-btn" class="practice-btn">Odpowiedz</button>
        </div>
      </div>
    `;

    const input = document.getElementById("answer");
    const hl = document.getElementById("hl");
    const fb = document.getElementById("feedback");
    const correct = item.en.toLowerCase();

    input.oninput = () => {
      hl.innerHTML = [...input.value].map((c,i) =>
        `<span class="${c.toLowerCase()===correct[i]?'correct':'wrong'}">${c}</span>`
      ).join("");
    };

    document.getElementById("check-btn").onclick = () => {
      if (input.value.toLowerCase() === correct) {
        queuePractice.shift();
        savePractice();
        renderPractice();
      } else {
        fb.textContent = item.en;
      }
    };

    document.getElementById("idk").onclick = () => fb.textContent = item.en;
    input.focus();
  }

  /* =======================
     MENU EVENTS
     ======================= */
  menuBtn.onclick = () => menuList.classList.toggle("hidden");
  document.addEventListener("click", e => {
    if (!e.target.closest(".menu")) menuList.classList.add("hidden");
  });

  menuList.onclick = e => {
    if (e.target.tagName !== "LI") return;
    const a = e.target.dataset.action;
    menuList.classList.add("hidden");

    if (a === "flashcards") renderCard();
    if (a === "en") { frontLang = "en"; renderCard(); }
    if (a === "pl") { frontLang = "pl"; renderCard(); }
    if (a === "reset") { queueFlashcards = shuffleArray([...words]); saveFlashcards(); renderCard(); }
    if (a === "resetPractice") { queuePractice = shuffleArray([...words]); savePractice(); renderPractice(); }
    if (a === "practice") renderPractice();
  };

  againBtn.onclick = () => swipeCard("left");
  knowBtn.onclick = () => swipeCard("right");

  /* =======================
     START
     ======================= */
  renderMenu();
  renderCard();

})();
