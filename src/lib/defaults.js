/**
 * Default settings + shared constants.
 *
 * Plain global (`LFB_DEFAULTS`) rather than an ES module so the same file can be
 * loaded by content scripts (via manifest `content_scripts`) and by the popup /
 * options pages (via <script> tags) without a bundler.
 */
(function () {
  "use strict";

  globalThis.LFB_STORAGE_KEY = "lfbSettings";

  globalThis.LFB_DEFAULTS = {
    // Master switch. When false the extension does nothing.
    enabled: true,

    // Blocking intensity.
    //   "easy"   – block ONLY the center home feed; keep left + right rails.
    //   "strict" – also hide both sidebars, suggested/promoted modules, and
    //              individual feed post permalinks (/feed/update/...).
    mode: "easy", // "easy" | "strict"

    // Replacement UI.
    showMessage: true,
    customText: "Use LinkedIn intentionally.",

    // Temporary pause.
    pauseDurationMinutes: 10, // default preset selected in the options page
    pausedUntil: 0 // epoch ms; while Date.now() < pausedUntil blocking is suspended
  };

  // Valid modes (shared by options + popup).
  globalThis.LFB_MODES = ["easy", "strict"];

  // Allowed temporary-pause presets (minutes). Shared by popup + options.
  globalThis.LFB_PAUSE_PRESETS = [10, 30, 60];
})();
