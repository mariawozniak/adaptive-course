<script>
/* --------------------------------------------------------
   USTAWIENIA PODSTAWOWE
--------------------------------------------------------- */

let conversationHistory = [];
let correctErrors = false;
let level = "b1";
let lastAIReply = "";
let isSpeaking = false;
let isListening = false;
let audioCtx = null;
let audioUnlocked = false;
let currentAudio = null;
let sharedMicStream = null;
let androidAudioWarmedUp = false;
let ttsAccent = localStorage.getItem("ttsAccent") || "british";
let replyMode = localStorage.getItem("replyMode") || "auto";
let manualTranscript = "";     // tekst zebrany w trybie manual
let manualRec = null;          // SpeechRecognition instance
let manualRecorder = null;     // MediaRecorder instance
let manualChunks = [];
let manualStream = null;
let resumeAfterTTS = false;
let ttsInterrupted = false;
let androidJustResumed = false;


const languageStyles = {
  british: `
Use BRITISH ENGLISH consistently.
- spelling: colour, organise, centre
- vocabulary: flat, lift, petrol, holiday
- expressions typical for UK English
Do NOT mix with American English.
`,
  american: `
Use AMERICAN ENGLISH consistently.
- spelling: color, organize, center
- vocabulary: apartment, elevator, gas, vacation
- expressions typical for US English
Do NOT mix with British English.
`
};



// === iOS SINGLE AUDIO ELEMENT (WYMAGANE) ===
const iosAudio = document.createElement("audio");
iosAudio.preload = "auto";
iosAudio.playsInline = true;
document.body.appendChild(iosAudio);


/* --------------------------------------------------------
   WAKE LOCK – utrzymanie działania, gdy ekran chce zasnąć
--------------------------------------------------------- */

let wakeLock = null;

async function enableWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");

      wakeLock.addEventListener("release", () => {
        console.log("WakeLock released");
      });

      console.log("WakeLock active");
    }
  } catch (err) {
    console.warn("WakeLock error:", err);
  }
}

function releaseWakeLock() {
  try {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  } catch (err) {
    console.warn("WakeLock release error:", err);
  }
}


const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isAndroid = /Android/i.test(navigator.userAgent);


const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canUseWebSpeech = !!SR && !isIOS;

const RESUME_DELAY = isAndroid ? 500 : 150;


/* --------------------------------------------------------
   OPISY POZIOMÓW
--------------------------------------------------------- */
const levelDescriptions = {
  a1: `You are speaking to an A1-level English learner (CEFR)...`,
  a2: `You are speaking to an A2-level English learner (CEFR)...`,
  b1: `You are speaking to a B1-level English learner (CEFR)...`,
  b2: `You are speaking to a B2-level English learner (CEFR)...`,
  c1: `You are speaking to a C1-level English learner (CEFR)...`
};
const levels = ["a1","a2","b1","b2","c1"];

const speechRateByLevel = {
  a1: 0.78,  // wyraźnie wolno, nauczycielsko
  a2: 0.88,  // wolno, ale płynniej
  b1: 1.0,   // pełna naturalność
  b2: 1.02,  // nadal naturalnie (praktycznie native)
  c1: 1.04   // minimalnie żwawiej, ALE bez „fast speech”
};


/* --------------------------------------------------------
   ZMIANA POZIOMU
--------------------------------------------------------- */
function levelUp() {
  const i = levels.indexOf(level);
  if (i < levels.length - 1) {
    level = levels[i + 1];
    displayMessage(`Level increased to ${level.toUpperCase()}.`, "ai");
  }
}
function levelDown() {
  const i = levels.indexOf(level);
  if (i > 0) {
    level = levels[i - 1];
    displayMessage(`Level decreased to ${level.toUpperCase()}.`, "ai");
  }
}

/* --------------------------------------------------------
   PRZYCISK SŁUCHANIA
--------------------------------------------------------- */
function updateButton(text, handler) {
  const btn = document.getElementById("speakBtn");
  btn.textContent = text;
  btn.onclick = handler;
  btn.classList.add("listening");
}
function resetButton() {
  const btn = document.getElementById("speakBtn");
  btn.classList.remove("listening");
  btn.textContent = "🎤 Speak";
  btn.onclick = toggleListening;
}

function unlockIOSAudio() {
  if (!isIOS || audioUnlocked) return;

  audioUnlocked = true;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // krótki „silent sound”
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);

  audioCtx.resume();

  // 🔥 CRITICAL: unlock <audio> element on iOS
  iosAudio.src =
    "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  iosAudio.play().catch(() => {});

  console.log("🔓 iOS audio unlocked");
}

document.addEventListener("touchstart", unlockIOSAudio, { once: true });

/* --------------------------------------------------------
   WYŚWIETLANIE WIADOMOŚCI
--------------------------------------------------------- */
function displayMessage(text, sender) {
  const messagesDiv = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `message ${sender}`;

  text.split(" ").forEach((word, i, arr) => {
    const span = document.createElement("span");
    span.className = "translatable-word";
    span.textContent = word;
    span.dataset.word = word;
    span.dataset.context = text;
    span.onclick = translateWord;

    div.appendChild(span);
    if (i < arr.length - 1) div.appendChild(document.createTextNode(" "));
  });

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* --------------------------------------------------------
   TŁUMACZENIE SŁÓW
--------------------------------------------------------- */
async function translateWord(event) {
  const word = event.target.dataset.word;
  const context = event.target.dataset.context;

  const prompt = `Przetłumacz tylko słowo "${word}" na polski tak jak występuje w zdaniu: "${context}". Jedno słowo, bez wyjaśnień.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4,
      temperature: 0.2
    })
  });

  const data = await res.json();
  showPopup(event.target, data.choices[0].message.content.trim());
}

function showPopup(target, text) {
  document.querySelectorAll(".translation-popup").forEach(p => p.remove());
  const popup = document.createElement("div");
  popup.className = "translation-popup";
  popup.textContent = text;
  document.body.appendChild(popup);

  const rect = target.getBoundingClientRect();
  popup.style.left = rect.left + window.scrollX + "px";
  popup.style.top = rect.bottom + window.scrollY + 5 + "px";

  requestAnimationFrame(() => popup.classList.add("show"));
  setTimeout(() => popup.remove(), 3000);
}

/* --------------------------------------------------------
   FALLBACK TTS (iOS)
--------------------------------------------------------- */
async function speakText(text) {
  isSpeaking = true;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        voice: "coral" // możesz później mapować british/american
      })
    });

    if (!res.ok) throw new Error("TTS failed");

    const stream = await res.blob();
    const url = URL.createObjectURL(stream);
    playAudio(url);

  } catch (e) {
    console.error("TTS error:", e);
  }
}



/* --------------------------------------------------------
   STREAMING TTS (Desktop)
--------------------------------------------------------- */
/* --------------------------------------------------------
   STABILNY, BEZ-DRŻĄCY TTS
--------------------------------------------------------- */


/* --------------------------------------------------------
   ODTWARZACZ Z FADE-IN PŁYNNY + AUTO-RESUME LISTENING
--------------------------------------------------------- */

let interruptMonitor = null;

async function getSharedMicStream() {
  if (!sharedMicStream) {
    sharedMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  return sharedMicStream;
}

function resetIOSMicIfNeeded() {
  if (!isIOS || !sharedMicStream) return;

  try {
    sharedMicStream.getTracks().forEach(t => t.stop());
  } catch {}

  sharedMicStream = null;
  console.log("♻️ iOS mic reset");
}


function startInterruptMonitor(stopAudioCallback) {
  getSharedMicStream().then(stream => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    interruptMonitor = true;


    let speechStart = null;

    function detect() {
      if (!interruptMonitor) {
        audioContext.close();
        return;
      }

      analyser.getFloatTimeDomainData(buffer);

      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);

      const now = performance.now();

      if (rms > 0.028) {          // 🔥 niższy próg
        if (!speechStart) speechStart = now;
        if (now - speechStart > 90) {  // 🔥 krócej
          interruptMonitor = false;
          audioContext.close();
          stopAudioCallback();
          return;
        }
      } else {
        speechStart = null;
      }

      requestAnimationFrame(detect);
    }

    detect();
  });
}



function playAudio(url) {
  ttsInterrupted = false;
  isSpeaking = true;

  iosAudio.pause();
  iosAudio.volume = 1.0;
  iosAudio.currentTime = 0;

  iosAudio.src = url;
  iosAudio.load();

  currentAudio = iosAudio;

 function interrupt() {
  interruptMonitor = false;   // 🔥 DODAJ TO NA SAMĄ GÓRĘ
 resetIOSMicIfNeeded(); 
  ttsInterrupted = true;

  if (!currentAudio) return;

  console.log("🛑 User interrupted AI");

  try {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  } catch {}

  currentAudio = null;
  isSpeaking = false;
  isListening = false;

  iosAudio.onended = null;

  setTimeout(() => {
    isSpeaking = false;
    isListening = false;

    if (replyMode === "manual") {
      startManualListening();
    } else {
      if (isAndroid) androidJustResumed = true;

      if (canUseWebSpeech) {
        startWebSpeech();
      } else {
        startSmartRecording();
      }
    }
  }, isAndroid ? 700 : 200);
}


  if (!isAndroid) {
    startInterruptMonitor(interrupt);
  }

  iosAudio.onended = () => {
  resetIOSMicIfNeeded(); 
    interruptMonitor = false;
    isSpeaking = false;
    currentAudio = null;
    URL.revokeObjectURL(url);

 if (replyMode === "auto" && !ttsInterrupted) {
  setTimeout(() => {
    toggleListening();
  }, isAndroid ? 800 : 300);
}


    if (replyMode === "manual") {
      setTimeout(() => {
        startManualListening();
      }, 600);
    }
  };

  iosAudio.onerror = () => {
    interruptMonitor = false;
    isSpeaking = false;
    currentAudio = null;
    URL.revokeObjectURL(url);
  };

  iosAudio.play().catch(() => {
    isSpeaking = false;
  });
}



/* --------------------------------------------------------
   AI TEKST
--------------------------------------------------------- */
async function getAITextReply(promptText) {
  // 🔥 1. Losowy ogólny styl emocjonalny (dla różnorodności)
  const styleOptions = ["energetic", "calm", "warm", "curious"];
  const randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];

  // 🔥 2. Automatyczne dopasowanie tonu do wypowiedzi użytkownika
  let emotionInstruction = "";

  if (promptText.includes("?")) {
    emotionInstruction = "Use a curious, slightly playful tone.";
  }
  if (/(sorry|apologize)/i.test(promptText)) {
    emotionInstruction = "Use a warm, reassuring tone, speaking softly.";
  }
  if (/(great|awesome|perfect|fantastic|super)/i.test(promptText)) {
    emotionInstruction = "Use a happy, upbeat tone with light excitement.";
  }

  // 🔥 3. SYSTEM MESSAGE – tutaj powstaje naturalny mówiony styl
const systemMessage = {
  role: "system",
  content: `
${levelDescriptions[level]}

${languageStyles[ttsAccent]}

${
  correctErrors
  ? `If the user makes any grammar or vocabulary mistake, respond in natural spoken English,
     but FIRST include a short correction in this exact format:

     "Did you mean: <correct sentence>?"

     You MUST COMPLETELY IGNORE and NEVER correct:
     - punctuation
     - capitalization
     - casing

     Only correct REAL language errors.

     After the correction, continue your natural spoken reply.

     Do NOT explain the grammar unless the user clicks the explanation button.`
  : "Respond in max 3 sentences and end with a question."
}

Rewrite your answer in natural spoken English, not written English.

Always include:
- contractions (I'm, you're, it's, don't)
- small fillers like “well”, “you know”, “hmm”, “oh”
- natural pauses using “...”
- a warm emotional hint when appropriate
- conversational rhythm, not textbook style

Never sound robotic or overly formal.
Speak in a slightly ${randomStyle} tone this time.

${emotionInstruction}
`
};


  // 🔥 4. Budowanie historii rozmowy
  const messages = [
    systemMessage,
    ...conversationHistory,
    { role: "user", content: promptText }
  ];

  // 🔥 5. Pobranie odpowiedzi AI
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages
    })
  });

  if (!res.ok) {
    throw new Error("Chat backend failed");
  }

  const data = await res.json();
  return data.reply;

}

/* --------------------------------------------------------
   OBSŁUGA ROZMOWY
--------------------------------------------------------- */
async function handleText(text) {


  displayMessage(text, "user");
document.getElementById("playAnswerBtn").style.display = "none";

  conversationHistory.push({ role: "user", content: text });

  // 🔥 1. Wywołujemy GPT tekst ASYNC
  const textPromise = getAITextReply(text);

  // 🔥 2. RÓWNOLEGLE wywołujeme TTS (ale jeszcze nie znamy tekstu)
  // Poczekamy później na tekst i od razu puszczamy głos
 

  // 🔥 3. Czekamy na odpowiedź tekstową
 const reply = await textPromise;

// 🔥 START TTS NATYCHMIAST
if (replyMode === "auto") {
  speakText(reply);
}

displayMessage(reply, "ai");
conversationHistory.push({ role: "assistant", content: reply });


// --- WYKRYWANIE BŁĘDU ---
// działa tylko, gdy "Poprawiaj błędy" = włączone
if (correctErrors && /did you mean/i.test(reply)) {
    document.getElementById("explainBtn").style.display = "inline-block";
    
    // wyciągamy poprawną wersję z "Did you mean: ____"
    const match = reply.match(/did you mean[: ]+(.+?)([.?]|$)/i);
    if (match) {
        window.correctVersion = match[1].trim();
        window.userSentence = text;
    }
} else {
    document.getElementById("explainBtn").style.display = "none";
}


// 🔥 ANDROID AUDIO WARM-UP — TYLKO RAZ
if (isAndroid && !androidAudioWarmedUp) {
  await warmUpAndroidAudio();
}

// --- TTS: auto vs manual ---
// --- TTS: auto vs manual ---



// TRYB NA ŻĄDANIE — ZAWSZE MÓW
if (replyMode === "manual") {
  if (isIOS) {
    if (audioUnlocked) {
      speakText(reply);
    } else {
      const playBtn = document.getElementById("playAnswerBtn");
      playBtn.style.display = "inline-block";
      playBtn.onclick = () => {
        unlockIOSAudio();
        speakText(reply);
      };
    }
  } else {
    speakText(reply);
  }
}

}
  

/* --------------------------------------------------------
   STT + MICROPHONE
--------------------------------------------------------- */
function toggleListening() {
if (isSpeaking) {
  console.warn("toggleListening blocked: still speaking");
  return;
}

  enableWakeLock();

  // ✅ TRYB NA ŻĄDANIE
  if (replyMode === "manual") {
    if (!isListening) startManualListening();
    return;
  }

  // ✅ TRYB AUTOMATYCZNY (jak było)
  if (isListening) return;

 // 🔥 jeśli poprawiamy błędy → ZAWSZE Whisper
if (correctErrors) {
  return startSmartRecording();
}

// standardowy flow
if (canUseWebSpeech) return startWebSpeech();
return startSmartRecording();
}
function setSpeakButtonToAnswer() {
  const btn = document.getElementById("speakBtn");
  btn.classList.add("listening");
  btn.textContent = "🔊 Odpowiedz";
  btn.onclick = commitManualReply;
}

function restoreSpeakButton() {
  resetButton(); // wraca do 🎤 Speak i onclick = toggleListening
}

async function startManualListening() {
  // reset buforów
  manualTranscript = "";
  manualChunks = [];

  isListening = true;
  setSpeakButtonToAnswer();

 

  // 2) inaczej (iOS/Android) od razu Whisper:
  startManualWhisper();
}

function stopManualWebSpeech() {
  try { manualRec?.stop(); } catch {}
  manualRec = null;
}

async function startManualWhisper() {
  manualStream = await getSharedMicStream();

  manualRecorder = new MediaRecorder(manualStream, {
    mimeType: "audio/webm;codecs=opus"
  });

  manualRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) manualChunks.push(e.data);
  };

  manualRecorder.start(); // 🔥 NIE MA STOPU AUTOMATYCZNEGO
}


async function commitManualReply() {
  // kliknięto "Odpowiedz"
  // 1) zatrzymaj nasłuch
  isListening = false;
  releaseWakeLock();

  // 2) jeśli działał WebSpeech
  if (manualRec) {
    stopManualWebSpeech();
    const finalText = manualTranscript.trim();
    restoreSpeakButton();

    if (finalText.length > 0) {
      handleText(finalText);
    }
    return;
  }

  // 3) jeśli działał Whisper (MediaRecorder)
  if (manualRecorder && manualRecorder.state === "recording") {
    await new Promise(resolve => {
      manualRecorder.onstop = resolve;
      manualRecorder.stop();
    });
  }

  const blob = new Blob(manualChunks, { type: "audio/webm" });

  manualRecorder = null;
  manualChunks = [];
  restoreSpeakButton();

  // 4) transkrypcja + odpowiedź AI dopiero teraz
  const text = await transcribeWhisper(blob);
  if (text) handleText(text);
}

// 🔥 Jedyna ścieżka Whisper STT (backend + filtr śmieci)
async function transcribeWhisper(blob) {
  if (blob.size < 1000) return "";

  const res = await fetch("/api/whisper", {
    method: "POST",
    body: blob
  });

  if (!res.ok) {
    console.error("Whisper backend failed");
    return "";
  }

  const data = await res.json();
  return (data.text || "").trim();
}



/* Web Speech STT */
function startWebSpeech() {
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;

  isListening = true;
  updateButton("🛑 Listening", () => rec.stop());

  let finalText = "";

  rec.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalText += e.results[i][0].transcript.trim() + " ";
      }
    }
  };

  rec.onend = () => {
    resetButton();
    isListening = false;
    if (finalText.trim().length > 0) handleText(finalText.trim());
  };

  rec.onerror = () => {
    resetButton();
    isListening = false;
    startSmartRecording();
  };

  rec.start();
}



/* Smart recording */
function startSmartRecording() {
 getSharedMicStream().then(stream => {

    isListening = true;
    updateButton("🛑 Listening", stopRecording);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus"
    });

    let chunks = [];
let lastSoundTime = Date.now() + 2000;
    let recordingStopped = false;

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    function stopRecording() {
      if (!recordingStopped && mediaRecorder.state === "recording") {
        recordingStopped = true;
        mediaRecorder.stop();
      }
    }

mediaRecorder.onstop = () => {
  resetButton();
  isListening = false;

  releaseWakeLock(); // 🔥 zwalniamy blokadę ekranu

  audioContext.close();

  const blob = new Blob(chunks, { type: "audio/webm" });
transcribeWhisper(blob).then(text => {
  if (text) handleText(text);
});
};

    mediaRecorder.start();

    const buffer = new Float32Array(analyser.fftSize);

    function monitor() {
      if (recordingStopped) return;

      analyser.getFloatTimeDomainData(buffer);

      // RMS = głośność
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);

      const now = Date.now();

      // Jeśli jest głos → reset licznika ciszy
      if (rms > 0.035) {
        lastSoundTime = now;
      }

      // Jeżeli mamy 3 sekundy ciszy → stop
    if (androidJustResumed) {
  lastSoundTime = now;
  androidJustResumed = false;
  requestAnimationFrame(monitor);
  return;
}

if (now - lastSoundTime > 3000) {
  stopRecording();
  return;
}


      requestAnimationFrame(monitor);
    }

    monitor();
  });
}


/* --------------------------------------------------------
   POPRAWIANIE BŁĘDÓW
--------------------------------------------------------- */
function toggleErrorCorrection() {
  correctErrors = !correctErrors;
  document.getElementById("toggleErrorsButton").textContent =
correctErrors ? "✏️ Nie poprawiaj" : "Poprawiaj błędy";
}

/* --------------------------------------------------------
   START
--------------------------------------------------------- */
resetButton();

document.getElementById("explainBtn").onclick = async () => {
    if (!window.correctVersion || !window.userSentence) return;

    const prompt = `
Użytkownik powiedział: "${window.userSentence}"
AI zasugerowało poprawę: "${window.correctVersion}"

Wyjaśnij po polsku, bardzo prosto, dla osoby początkującej:

ZASADY:
- NIE zaczynaj odpowiedzi od fraz typu:
  „w zdaniu użytkownika”, „w tym zdaniu”, „użytkownik powiedział”
- NIE opisuj zdania z zewnątrz
- Mów bezpośrednio, naturalnie, jak do osoby uczącej się

- NIE używaj pojęć gramatycznych
- Używaj prostych sformułowań typu:
  „gdy mówimy o…”, „kiedy mówisz o…”, „w takich sytuacjach”

STRUKTURA:
1. Co było nie tak (jedno krótkie zdanie, bez wstępu)
2. Jak jest poprawnie (jedno zdanie)
3. Jak to zapamiętać (jedna prosta reguła)

Maksymalnie 3 krótkie zdania.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        })
    });

    const data = await res.json();
    const explanation = data.choices[0].message.content;

    displayMessage(explanation, "ai");

    // schowaj po wykorzystaniu
    document.getElementById("explainBtn").style.display = "none";
};

async function warmUpAndroidAudio() {
  if (!isAndroid || androidAudioWarmedUp) return;

  androidAudioWarmedUp = true;

  const silentMp3 =
    "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA";

  const audio = new Audio(silentMp3);
  audio.volume = 0;

  try {
    await audio.play();
    audio.pause();
  } catch (e) {
    console.warn("Android audio warmup blocked", e);
  }

  console.log("🔥 Android audio warmed up");
}

/* --------------------------------------------------------
   SETTINGS (BOTTOM BUTTON)
--------------------------------------------------------- */

// toggle panel
document.getElementById("settingsBtnBottom").onclick = () => {
  const panel = document.getElementById("settingsPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
};

// accent selection
// accent selection
document.querySelectorAll("[data-accent]").forEach(btn => {
  btn.onclick = () => {
    ttsAccent = btn.dataset.accent;
    localStorage.setItem("ttsAccent", ttsAccent);
    highlightSettings();
  };
});

// reply mode selection (🔥 JEDYNE MIEJSCE)
document.querySelectorAll("[data-reply]").forEach(btn => {
  btn.onclick = () => {
    const newMode = btn.dataset.reply;
    if (newMode === replyMode) return;

    replyMode = newMode;
    localStorage.setItem("replyMode", replyMode);
    highlightSettings();

    resetListeningState();

if (replyMode === "auto") {
  resumeAfterTTS = true;
}

  };
});


function highlightSettings() {
  document.querySelectorAll("[data-accent]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accent === ttsAccent);
  });

  document.querySelectorAll("[data-reply]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.reply === replyMode);
  });
}

function resetListeningState() {
  // zatrzymaj wszystko
  isListening = false;
  isSpeaking = false;

  // zatrzymaj TTS
  try {
    iosAudio.pause();

    iosAudio.currentTime = 0;
  } catch {}

  currentAudio = null;
  interruptMonitor = false;

  // zatrzymaj manual recorder
  try {
    if (manualRecorder && manualRecorder.state === "recording") {
      manualRecorder.stop();
    }
  } catch {}

  manualRecorder = null;
  manualChunks = [];

  // UI
  resetButton();
}

</script>
