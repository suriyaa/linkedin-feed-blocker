/**
 * Thin wrapper around extension storage (browser.storage.local).
 *
 * We deliberately use the extension storage API rather than localStorage /
 * sessionStorage so state is shared across popup, options, background and
 * content scripts, and survives correctly in the MV3 model.
 *
 * Exposes a global `LFB` object with promise-based helpers.
 */
(function () {
  "use strict";

  const KEY = globalThis.LFB_STORAGE_KEY;
  const DEFAULTS = globalThis.LFB_DEFAULTS;

  async function getSettings() {
    try {
      const stored = await browser.storage.local.get(KEY);
      // Merge over defaults so newly added settings always have a value.
      return Object.assign({}, DEFAULTS, stored && stored[KEY] ? stored[KEY] : {});
    } catch (e) {
      // Storage can transiently fail (e.g. during extension reload). Fail safe
      // to defaults so the user still gets feed blocking.
      return Object.assign({}, DEFAULTS);
    }
  }

  async function setSettings(patch) {
    const current = await getSettings();
    const next = Object.assign({}, current, patch);
    await browser.storage.local.set({ [KEY]: next });
    return next;
  }

  async function resetSettings() {
    await browser.storage.local.set({ [KEY]: Object.assign({}, DEFAULTS) });
    return Object.assign({}, DEFAULTS);
  }

  /**
   * Subscribe to settings changes. Callback receives the full, merged settings
   * object. Returns an unsubscribe function.
   */
  function onSettingsChanged(callback) {
    const listener = (changes, area) => {
      if (area !== "local" || !changes[KEY]) return;
      const newValue = changes[KEY].newValue || {};
      callback(Object.assign({}, DEFAULTS, newValue));
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }

  /** True while a temporary pause is active. */
  function isPaused(settings, now) {
    const t = typeof now === "number" ? now : Date.now();
    return typeof settings.pausedUntil === "number" && settings.pausedUntil > t;
  }

  globalThis.LFB = Object.assign(globalThis.LFB || {}, {
    getSettings,
    setSettings,
    resetSettings,
    onSettingsChanged,
    isPaused
  });
})();
