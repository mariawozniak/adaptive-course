export const modules = [
  {
    id: "module_1",
    title: "Restaurant",
    level: "A2",
    videoId: "hy_72TdNtc4",

    activities: [
      /* =======================
         SŁÓWKA
         ======================= */
      {
        id: "vocabulary",
        label: "Słówka",
        required: true,
        completionRule: "any", // ukończone, jeśli dowolny wariant zaliczony

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
            src: "/assets/vocab/module_1.mp3",
            completion: "manual" // ✅ user decyduje
          },
          {
            id: "module_1__vocabulary__print",
            label: "Lista do druku",
            type: "pdf",
            src: "/assets/vocab/module_1.pdf",
            completion: "manual" // ✅ user decyduje
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
        type: "internal",
        key: "test",
        lessonId: "module_1__test",
        completion: "auto" // ✅ zaliczany automatycznie po zdaniu
      },

      /* =======================
         LISTENING
         ======================= */
      {
        id: "listening",
        label: "Listening",
        required: true,
        // domyślna reguła: all (wszystkie warianty, jeśli user je zaznaczy)

        variants: [
          {
            id: "module_1__listening__quiz",
            label: "Quiz",
            type: "iframe",
            src: "/listening/index.html?mode=quiz",
            completion: "manual" // ✅ manual – intencja użytkownika
          },
          {
            id: "module_1__listening__gapfill",
            label: "Gap fill",
            type: "iframe",
            src: "/listening/index.html?mode=gapfill",
            completion: "manual"
          },
          {
            id: "module_1__listening__mixed",
            label: "Mixed",
            type: "iframe",
            src: "/listening/index.html?mode=mixed",
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
        src: "/shadowing/index.html",
        lessonId: "module_1__shadowing",
        completion: "manual" // ✅ user sam uznaje ukończenie
      },

      /* =======================
         AI (PLACEHOLDER)
         ======================= */
      {
        id: "ai",
        label: "Lektor AI",
        required: false,
        enabled: false
        // docelowo:
        // completion: "auto"
        // requires: ["vocabulary", "test", "listening", "shadowing"]
      }
    ]
  }
];
