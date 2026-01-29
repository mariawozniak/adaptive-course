export const modules = [
  {
    id: "module_1",
    title: "Friends – restaurant",
    level: 3, // A2
    videoId: "hy_72TdNtc4",

    activities: [
      /* =======================
         SŁÓWKA
         ======================= */
      {
        id: "vocabulary",
        label: "Słówka",
        required: true,
        completionRule: "any",

        variants: [
          {
            id: "module_1__vocabulary__app",
            label: "Aplikacja do słówek",
            type: "iframe",
            src: "/vocabulary/index.html",
            completion: "auto"
          },
          {
            id: "module_1__vocabulary__audio",
            label: "Nagranie MP3",
            type: "audio",
            lessonId: "module_1__vocabulary__audio",
            src: "/assets/vocab/module_1_vocab_audio.mp3",
            completion: "manual"
          },
          {
            id: "module_1__vocabulary__print",
            label: "Lista do druku",
            type: "pdf",
            lessonId: "module_1__vocabulary__print",
            src: "/assets/vocab/module_1.pdf",
            completion: "manual"
          }
        ]
      },

      /* =======================
         TEST
         ======================= */
      {
        id: "test",
        label: "Test",
        required: true,
        type: "iframe",
        src: "/test/index.html?module=module_1",
        lessonId: "module_1__test",
        completion: "auto"
      },

      /* =======================
         LISTENING
         ======================= */
      {
        id: "listening",
        label: "Listening",
        required: true,
        completionRule: "any",

        variants: [
          {
            id: "module_1__listening__quiz",
            label: "Quiz",
            type: "iframe",
            src: "/listening/index.html?module=module_1&mode=quiz",
            completion: "manual"
          },
          {
            id: "module_1__listening__gapfill",
            label: "Gap fill",
            type: "iframe",
            src: "/listening/index.html?module=module_1&mode=gapfill",
            completion: "manual"
          },
          {
            id: "module_1__listening__mixed",
            label: "Mixed",
            type: "iframe",
            src: "/listening/index.html?module=module_1&mode=mixed",
            completion: "manual"
          }
        ]
      },

      /* =======================
         SHADOWING
         ======================= */
      {
        id: "shadowing",
        label: "Shadowing",
        required: false,
        type: "iframe",
        src: "/shadowing/index.html?module=module_1",
        lessonId: "module_1__shadowing",
        completion: "manual"
      },

      /* =======================
         AI LEKTOR
         ======================= */
      {
        id: "ai-voice",
        label: "AI Lektor",
        required: false,
        type: "iframe",
        src: "/ai-voice/index.html?module=module_1",
        lessonId: "module_1__ai_voice",
        completion: "manual"
      }
    ]
  },

  {
    id: "module_2",
    title: "Modern Family - airport",
    level: 3, // A2
    videoId: "32MynUrjGyY",

    activities: [
      /* =======================
         SŁÓWKA
         ======================= */
      {
        id: "vocabulary",
        label: "Słówka",
        required: true,
        completionRule: "any",

        variants: [
          {
            id: "module_2__vocabulary__app",
            label: "Aplikacja do słówek",
            type: "iframe",
            src: "/vocabulary/index.html",
            completion: "auto"
          },
          {
            id: "module_2__vocabulary__audio",
            label: "Nagranie MP3",
            type: "audio",
            lessonId: "module_2__vocabulary__audio",
            src: "/assets/vocab/module_2_vocab_audio.mp3",
            completion: "manual"
          },
          {
            id: "module_2__vocabulary__print",
            label: "Lista do druku",
            type: "pdf",
            lessonId: "module_2__vocabulary__print",
            src: "/assets/vocab/module_2.pdf",
            completion: "manual"
          }
        ]
      },

      /* =======================
         TEST
         ======================= */
      {
        id: "test",
        label: "Test",
        required: true,
        type: "iframe",
        src: "/test/index.html?module=module_2",
        lessonId: "module_2__test",
        completion: "auto"
      },

      /* =======================
         LISTENING
         ======================= */
      {
        id: "listening",
        label: "Listening",
        required: true,
        completionRule: "any",

        variants: [
          {
            id: "module_2__listening__quiz",
            label: "Quiz",
            type: "iframe",
            src: "/listening/index.html?module=module_2&mode=quiz",
            completion: "manual"
          },
          {
            id: "module_2__listening__gapfill",
            label: "Gap fill",
            type: "iframe",
            src: "/listening/index.html?module=module_2&mode=gapfill",
            completion: "manual"
          },
          {
            id: "module_2__listening__mixed",
            label: "Mixed",
            type: "iframe",
            src: "/listening/index.html?module=module_2&mode=mixed",
            completion: "manual"
          }
        ]
      },

      /* =======================
         SHADOWING
         ======================= */
      {
        id: "shadowing",
        label: "Shadowing",
        required: false,
        type: "iframe",
        src: "/shadowing/index.html?module=module_2",
        lessonId: "module_2__shadowing",
        completion: "manual"
      },

      /* =======================
         AI LEKTOR
         ======================= */
      {
        id: "ai-voice",
        label: "AI Lektor",
        required: false,
        type: "iframe",
        src: "/ai-voice/index.html?module=module_2",
        lessonId: "module_2__ai_voice",
        completion: "manual"
      }
    ]
  }
];
