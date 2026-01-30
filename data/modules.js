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
  lessonId: "module_1__vocabulary__app",
  completion: "auto"
},

          {
  id: "module_1__vocabulary__audio",
  label: "Nagranie MP3",
  type: "audio",
  lessonId: "module_1__vocabulary__audio",
  src: "assets/vocab/module_1_vocab_audio.mp3",
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
    level: 3, // A2 = 3
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
  src: "/vocabulary/index.html?module=module_2",
  lessonId: "module_2__vocabulary__app",
  completion: "auto"

          },
          {
  id: "module_2__vocabulary__audio",
  label: "Nagranie MP3",
  type: "audio",
  lessonId: "module_2__vocabulary__audio",
  src: "assets/vocab/module_2_vocab_audio.mp3",
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
},

    ]
  },
  {
  id: "module_3",
  title: "Saturday Night Live: hotel",
  level: 3,
  videoId: "1050475042",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_3__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_3",
          lessonId: "module_3__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_3__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_3_vocab_audio.mp3",
          lessonId: "module_3__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_3__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_3.pdf",
          lessonId: "module_3__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_3",
      lessonId: "module_3__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_3__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_3&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_3__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_3&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_3__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_3&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_3",
      lessonId: "module_3__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_3",
      lessonId: "module_3__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_4",
  title: "Ed Sheeran - Perfect",
  level: 3,
  videoId: "vUI8Oftasg8",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_4__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_4",
          lessonId: "module_4__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_4__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_4_vocab_audio.mp3",
          lessonId: "module_4__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_4__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_4.pdf",
          lessonId: "module_4__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_4",
      lessonId: "module_4__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_4__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_4&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_4__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_4&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_4__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_4&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_4",
      lessonId: "module_4__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_4",
      lessonId: "module_4__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_5",
  title: "Friends - Coffee House",
  level: 3,
  videoId: "3r2HG2fJVHA",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_5__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_5",
          lessonId: "module_5__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_5__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_5_vocab_audio.mp3",
          lessonId: "module_5__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_5__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_5.pdf",
          lessonId: "module_5__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_5",
      lessonId: "module_5__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_5__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_5&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_5__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_5&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_5__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_5&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_5",
      lessonId: "module_5__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_5",
      lessonId: "module_5__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_6",
  title: "Stranger Things",
  level: 3,
  videoId: "mBsG5ag6DWM",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_6__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_6",
          lessonId: "module_6__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_6__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_6_vocab_audio.mp3",
          lessonId: "module_6__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_6__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_6.pdf",
          lessonId: "module_6__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_6",
      lessonId: "module_6__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_6__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_6&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_6__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_6&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_6__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_6&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_6",
      lessonId: "module_6__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_6",
      lessonId: "module_6__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_7",
  title: "The Crown",
  level: 3,
  videoId: "re91rg5g_YI",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_7__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_7",
          lessonId: "module_7__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_7__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_7_vocab_audio.mp3",
          lessonId: "module_7__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_7__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_7.pdf",
          lessonId: "module_7__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_7",
      lessonId: "module_7__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_7__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_7&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_7__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_7&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_7__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_7&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_7",
      lessonId: "module_7__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_7",
      lessonId: "module_7__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_8",
  title: "Adele - Someone Like You",
  level: 3,
  videoId: "pAkwimWgYTg",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_8__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_8",
          lessonId: "module_8__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_8__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_8_vocab_audio.mp3",
          lessonId: "module_8__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_8__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_8.pdf",
          lessonId: "module_8__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_8",
      lessonId: "module_8__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_8__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_8&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_8__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_8&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_8__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_8&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_8",
      lessonId: "module_8__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_8",
      lessonId: "module_8__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_9",
  title: "Friends - thanksgiving",
  level: 3,
  videoId: "NA-Wzuwj__Y",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_9__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_9",
          lessonId: "module_9__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_9__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_9_vocab_audio.mp3",
          lessonId: "module_9__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_9__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_9.pdf",
          lessonId: "module_9__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_9",
      lessonId: "module_9__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_9__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_9&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_9__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_9&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_9__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_9&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_9",
      lessonId: "module_9__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_9",
      lessonId: "module_9__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_10",
  title: "Saturday Night Live - hotel",
  level: 3,
  videoId: "1050338812",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_10__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_10",
          lessonId: "module_10__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_10__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_10_vocab_audio.mp3",
          lessonId: "module_10__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_10__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_10.pdf",
          lessonId: "module_10__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_10",
      lessonId: "module_10__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_10__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_10&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_10__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_10&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_10__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_10&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_10",
      lessonId: "module_10__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_10",
      lessonId: "module_10__ai_voice",
      completion: "manual"
    }
  ]
},

  {
  id: "module_11",
  title: "Suits",
  level: 3,
  videoId: "RYzDhsnmpjc",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_11__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_11",
          lessonId: "module_11__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_11__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_11_vocab_audio.mp3",
          lessonId: "module_11__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_11__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_11.pdf",
          lessonId: "module_11__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_11",
      lessonId: "module_11__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_11__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_11&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_11__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_11&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_11__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_11&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_11",
      lessonId: "module_11__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_11",
      lessonId: "module_11__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_12",
  title: "Taylor Swift - Antihero",
  level: 3,
  videoId: "qeWsP3NWVow",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_12__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_12",
          lessonId: "module_12__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_12__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_12_vocab_audio.mp3",
          lessonId: "module_12__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_12__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_12.pdf",
          lessonId: "module_12__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_12",
      lessonId: "module_12__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_12__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_12&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_12__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_12&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_12__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_12&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_12",
      lessonId: "module_12__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_12",
      lessonId: "module_12__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_13",
  title: "Stranger Things",
  level: 3,
  videoId: "o47f3pJtvpQ",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_13__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_13",
          lessonId: "module_13__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_13__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_13_vocab_audio.mp3",
          lessonId: "module_13__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_13__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_13.pdf",
          lessonId: "module_13__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_13",
      lessonId: "module_13__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_13__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_13&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_13__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_13&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_13__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_13&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_13",
      lessonId: "module_13__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_13",
      lessonId: "module_13__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_14",
  title: "Friends - airport",
  level: 3,
  videoId: "9BoSFeFSoVw",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_14__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_14",
          lessonId: "module_14__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_14__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_14_vocab_audio.mp3",
          lessonId: "module_14__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_14__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_14.pdf",
          lessonId: "module_14__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_14",
      lessonId: "module_14__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_14__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_14&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_14__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_14&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_14__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_14&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_14",
      lessonId: "module_14__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_14",
      lessonId: "module_14__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_15",
  title: "Suits",
  level: 3,
  videoId: "-mfpZOwxLN0",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_15__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_15",
          lessonId: "module_15__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_15__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_15_vocab_audio.mp3",
          lessonId: "module_15__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_15__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_15.pdf",
          lessonId: "module_15__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_15",
      lessonId: "module_15__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_15__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_15&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_15__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_15&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_15__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_15&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_15",
      lessonId: "module_15__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_15",
      lessonId: "module_15__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_16",
  title: "Timbaland - Apologize",
  level: 3,
  videoId: "138W2Ox8cos",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_16__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_16",
          lessonId: "module_16__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_16__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_16_vocab_audio.mp3",
          lessonId: "module_16__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_16__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_16.pdf",
          lessonId: "module_16__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_16",
      lessonId: "module_16__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_16__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_16&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_16__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_16&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_16__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_16&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_16",
      lessonId: "module_16__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_16",
      lessonId: "module_16__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_17",
  title: "The Crown",
  level: 3,
  videoId: "UYIIRveNuUY",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_17__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_17",
          lessonId: "module_17__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_17__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_17_vocab_audio.mp3",
          lessonId: "module_17__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_17__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_17.pdf",
          lessonId: "module_17__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_17",
      lessonId: "module_17__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_17__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_17&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_17__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_17&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_17__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_17&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_17",
      lessonId: "module_17__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_17",
      lessonId: "module_17__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_18",
  title: "Suits",
  level: 3,
  videoId: "_0jMPi50MG8",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_18__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_18",
          lessonId: "module_18__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_18__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_18_vocab_audio.mp3",
          lessonId: "module_18__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_18__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_18.pdf",
          lessonId: "module_18__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_18",
      lessonId: "module_18__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_18__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_18&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_18__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_18&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_18__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_18&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_18",
      lessonId: "module_18__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_18",
      lessonId: "module_18__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_19",
  title: "Dawnton Abbey",
  level: 3,
  videoId: "C5Cq-qH1zS4",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_19__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_19",
          lessonId: "module_19__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_19__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_19_vocab_audio.mp3",
          lessonId: "module_19__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_19__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_19.pdf",
          lessonId: "module_19__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_19",
      lessonId: "module_19__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_19__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_19&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_19__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_19&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_19__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_19&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_19",
      lessonId: "module_19__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_19",
      lessonId: "module_19__ai_voice",
      completion: "manual"
    }
  ]
},

{
  id: "module_20",
  title: "John Legend - All of Me",
  level: 3,
  videoId: "NlXvArCM9nc",
  activities: [
    {
      id: "vocabulary",
      label: "Słówka",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_20__vocabulary__app",
          label: "Aplikacja do słówek",
          type: "iframe",
          src: "/vocabulary/index.html?module=module_20",
          lessonId: "module_20__vocabulary__app",
          completion: "auto"
        },
        {
          id: "module_20__vocabulary__audio",
          label: "Nagranie MP3",
          type: "audio",
          src: "assets/vocab/module_20_vocab_audio.mp3",
          lessonId: "module_20__vocabulary__audio",
          completion: "manual"
        },
        {
          id: "module_20__vocabulary__print",
          label: "Lista do druku",
          type: "pdf",
          src: "/assets/vocab/module_20.pdf",
          lessonId: "module_20__vocabulary__print",
          completion: "manual"
        }
      ]
    },
    {
      id: "test",
      label: "Test",
      required: true,
      type: "iframe",
      src: "/test/index.html?module=module_20",
      lessonId: "module_20__test",
      completion: "auto"
    },
    {
      id: "listening",
      label: "Listening",
      required: true,
      completionRule: "any",
      variants: [
        {
          id: "module_20__listening__quiz",
          label: "Quiz",
          type: "iframe",
          src: "/listening/index.html?module=module_20&mode=quiz",
          completion: "manual"
        },
        {
          id: "module_20__listening__gapfill",
          label: "Gap fill",
          type: "iframe",
          src: "/listening/index.html?module=module_20&mode=gapfill",
          completion: "manual"
        },
        {
          id: "module_20__listening__mixed",
          label: "Mixed",
          type: "iframe",
          src: "/listening/index.html?module=module_20&mode=mixed",
          completion: "manual"
        }
      ]
    },
    {
      id: "shadowing",
      label: "Shadowing",
      required: false,
      type: "iframe",
      src: "/shadowing/index.html?module=module_20",
      lessonId: "module_20__shadowing",
      completion: "manual"
    },
    {
      id: "ai-voice",
      label: "AI Lektor",
      required: false,
      type: "iframe",
      src: "/ai-voice/index.html?module=module_20",
      lessonId: "module_20__ai_voice",
      completion: "manual"
    }
  ]
}
];


