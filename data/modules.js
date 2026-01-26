export const modules = [
  {
    id: "module_1",
    title: "Restaurant",
    level: 3, // A2 = 3
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
            src: "/assets/vocab/module_1.mp3",
            completion: "manual"
          },
          {
            id: "module_1__vocabulary__print",
            label: "Lista do druku",
            type: "pdf",
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
         AI (PLACEHOLDER)
         ======================= */
      {
        id: "ai",
        label: "Lektor AI",
        required: false,
        enabled: false
      }
    ]
  }
];
