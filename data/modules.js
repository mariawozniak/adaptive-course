export const modules = [
  {
    id: "module_1",
    title: "Restaurant",
    level: "A2",

    // główne wideo modułu (intro / kontekst)
    videoId: "hy_72TdNtc4",

    // SEKWENCJA AKTYWNOŚCI MODUŁU
    activities: [
      {
        id: "vocabulary",
        label: "Słówka",
        required: true,

        variants: [
          {
            id: "vocab_app",
            label: "Aplikacja do słówek",
            type: "internal",
            key: "vocabulary"
          },
          {
            id: "vocab_audio",
            label: "Nagranie MP3",
            type: "audio",
            src: "/assets/vocab/module_1.mp3"
          },
          {
            id: "vocab_print",
            label: "Lista do druku",
            type: "pdf",
            src: "/assets/vocab/module_1.pdf"
          }
        ]
      },

      {
        id: "test",
        label: "Test",
        required: true,
        type: "internal",
        key: "test"
      },

      {
        id: "listening",
        label: "Listening",
        required: true,

        variants: [
          {
            id: "listening_quiz",
            label: "Quiz",
            type: "iframe",
            src: "/listening/index.html?mode=quiz"
          },
          {
            id: "listening_gapfill",
            label: "Gap fill",
            type: "iframe",
            src: "/listening/index.html?mode=gapfill"
          },
          {
            id: "listening_mixed",
            label: "Mixed",
            type: "iframe",
            src: "/listening/index.html?mode=mixed"
          }
        ]
      },

      {
        id: "shadowing",
        label: "Shadowing",
        required: false,
        type: "iframe",
        src: "/shadowing/index.html"
      },

      {
        id: "ai",
        label: "Lektor AI",
        required: false,
        enabled: false
      }
    ]
  }
];
