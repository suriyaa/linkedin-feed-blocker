/**
 * Popup controller.
 *
 * Shows current status, master enable/disable, and pause presets. All state is
 * read/written through the shared LFB storage helpers, so the content script
 * reacts automatically via storage.onChanged.
 */
(function () {
  "use strict";

  const masterToggle = document.getElementById("master-toggle");
  const statusLine = document.getElementById("status-line");
  const resumeBtn = document.getElementById("resume-btn");
  const openOptions = document.getElementById("open-options");
  const pauseButtons = Array.from(document.querySelectorAll("[data-pause]"));
  const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
  const modeDesc = document.getElementById("mode-desc");
  const pauseSection = document.getElementById("pause-section");

  const MODE_DESC = {
    easy: "Blocks only the center feed. Sidebars stay.",
    strict: "Blocks feed, sidebars, suggested posts, and post links."
  };

  function formatRemaining(ms) {
    const mins = Math.ceil(ms / 60000);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins} min`;
  }

  function render(settings) {
    masterToggle.checked = !!settings.enabled;

    const mode = LFB_MODES.includes(settings.mode) ? settings.mode : "easy";
    modeButtons.forEach((btn) => {
      const on = btn.dataset.mode === mode;
      btn.classList.toggle("segmented__btn--active", on);
      btn.setAttribute("aria-checked", String(on));
    });
    modeDesc.textContent = MODE_DESC[mode] || "";

    // Strict mode has no escape hatch: hide pause/resume entirely.
    const strict = mode === "strict";
    pauseSection.hidden = strict;

    const paused = LFB.isPaused(settings);
    resumeBtn.hidden = strict || !paused;

    if (!settings.enabled) {
      statusLine.textContent = "Blocking is off.";
    } else if (paused) {
      statusLine.textContent =
        "Paused — " + formatRemaining(settings.pausedUntil - Date.now()) + " left.";
    } else {
      statusLine.textContent =
        "Active — " + (mode === "strict" ? "strict" : "easy") + " mode.";
    }
  }

  async function refresh() {
    render(await LFB.getSettings());
  }

  masterToggle.addEventListener("change", async () => {
    await LFB.setSettings({ enabled: masterToggle.checked });
    refresh();
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const patch = { mode: btn.dataset.mode, enabled: true };
      // Entering strict clears any active pause so it takes effect immediately.
      if (btn.dataset.mode === "strict") patch.pausedUntil = 0;
      await LFB.setSettings(patch);
      refresh();
    });
  });

  pauseButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const minutes = parseInt(btn.dataset.pause, 10);
      const until = Date.now() + minutes * 60000;
      await LFB.setSettings({ pausedUntil: until, enabled: true });
      refresh();
    });
  });

  resumeBtn.addEventListener("click", async () => {
    await LFB.setSettings({ pausedUntil: 0 });
    refresh();
  });

  openOptions.addEventListener("click", () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
      window.close();
    }
  });

  // Keep the popup live if a pause counts down while it's open.
  LFB.onSettingsChanged(render);
  refresh();
})();
