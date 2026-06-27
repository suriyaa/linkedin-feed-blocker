/**
 * Background service worker (MV3).
 *
 * Kept intentionally tiny — the content script + storage carry the state, so the
 * worker can sleep freely. Two jobs:
 *   1. Seed default settings on install.
 *   2. Open the options page when the content overlay's "Settings" is clicked
 *      (a content script cannot call runtime.openOptionsPage directly).
 *
 * No `import` is used so the same file works as a Chrome service_worker and as a
 * Firefox background script (manifest declares both keys).
 */
"use strict";

// `browser` is native in Firefox; alias chrome for Chromium.
if (typeof globalThis.browser === "undefined" && typeof globalThis.chrome !== "undefined") {
  globalThis.browser = globalThis.chrome;
}

const KEY = "lfbSettings";

const DEFAULTS = {
  enabled: true,
  mode: "easy", // "easy" | "strict"
  showMessage: true,
  customText: "Use LinkedIn intentionally.",
  pauseDurationMinutes: 10,
  pausedUntil: 0
};

browser.runtime.onInstalled.addListener(async () => {
  try {
    const stored = await browser.storage.local.get(KEY);
    if (!stored || !stored[KEY]) {
      await browser.storage.local.set({ [KEY]: DEFAULTS });
    }
  } catch (e) {
    // Non-fatal: getSettings() in the content/popup layers also merges defaults.
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === "lfb-open-options") {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    }
  }
  // No async response needed.
});
