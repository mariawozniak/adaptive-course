export const modules = [
  {
    id: "module_1",
    title: "Restaurant",
    level: "A2",
    videoId: "hy_72TdNtc4",

    activities: [
      {
        id: "vocabulary",
        label: "Słówka",
        required: true,

        variants: [
          {
            id: "module_1__vocabulary__app",
            label: "Aplikacja do słówek",
            type: "internal",
            key: "vocabulary"
          },
          {
            id: "module_1__vocabulary__audio",
            label: "Nagranie MP3",
            type: "audio",
            src: "/assets/vocab/module_1.mp3"
          },
          {
            id: "module_1__vocabulary__print",
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
        key: "test",
        // 👇 TEST TEŻ JEST LEKCJĄ
        lessonId: "module_1__test"
      },

      {
        id: "listening",
        label: "Listening",
        required: true,

        variants: [
          {
            id: "module_1__listening__quiz",
            label: "Quiz",
            type: "iframe",
            src: "/listening/index.html?mode=quiz"
          },
          {
            id: "module_1__listening__gapfill",
            label: "Gap fill",
            type: "iframe",
            src: "/listening/index.html?mode=gapfill"
          },
          {
            id: "module_1__listening__mixed",
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
        src: "/shadowing/index.html",
        lessonId: "module_1__shadowing"
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
