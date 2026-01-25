console.log("🧠 CORE LOADED");

const params = new URLSearchParams(window.location.search);
const MODE = params.get("mode") || "gapfill";
const MODULE_ID = params.get("module") || "module_1";

window.APP_CONTEXT = {
  MODE,
  MODULE_ID
};
