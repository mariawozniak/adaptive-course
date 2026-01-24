{
  id: "vocabulary",
  label: "Słówka",
  required: true,
  completionRule: "any",

  variants: [
    {
      id: "module_1__vocabulary__app",
      label: "Aplikacja do słówek",
      type: "internal",
      completion: "auto",      // ✅ DODAJ
      key: "vocabulary"
    },
    {
      id: "module_1__vocabulary__audio",
      label: "Nagranie MP3",
      type: "audio",
      completion: "manual",    // ✅ DODAJ
      src: "/assets/vocab/module_1.mp3"
    },
    {
      id: "module_1__vocabulary__print",
      label: "Lista do druku",
      type: "pdf",
      completion: "manual",    // ✅ DODAJ
      src: "/assets/vocab/module_1.pdf"
    }
  ]
}
