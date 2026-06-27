/**
 * Options controller.
 *
 * Auto-saves on every change (no explicit Save button needed) and confirms with
 * a transient status message. All persistence goes through LFB storage helpers.
 */
(function () {
  "use strict";

  const form = document.getElementById("settings-form");
  const resetBtn = document.getElementById("reset-btn");
  const saveStatus = document.getElementById("save-status");

  const CHECKBOXES = ["showMessage"];

  let statusTimer = null;
  function flash(text) {
    saveStatus.textContent = text;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      saveStatus.textContent = "";
    }, 1500);
  }

  function fillForm(settings) {
    CHECKBOXES.forEach((name) => {
      const el = form.elements[name];
      if (el) el.checked = !!settings[name];
    });
    // Mode radio group.
    const mode = LFB_MODES.includes(settings.mode) ? settings.mode : "easy";
    const modeInput = form.querySelector(
      `input[name="mode"][value="${mode}"]`
    );
    if (modeInput) modeInput.checked = true;

    form.elements.customText.value = settings.customText || "";
    form.elements.pauseDurationMinutes.value = String(
      settings.pauseDurationMinutes || 10
    );
  }

  function readForm() {
    const patch = {};
    CHECKBOXES.forEach((name) => {
      patch[name] = !!form.elements[name].checked;
    });
    const checkedMode = form.querySelector('input[name="mode"]:checked');
    patch.mode = checkedMode && LFB_MODES.includes(checkedMode.value)
      ? checkedMode.value
      : "easy";
    // Strict clears any active pause so it takes effect immediately.
    if (patch.mode === "strict") patch.pausedUntil = 0;
    patch.customText = form.elements.customText.value.trim();
    patch.pauseDurationMinutes = parseInt(
      form.elements.pauseDurationMinutes.value,
      10
    );
    return patch;
  }

  async function save() {
    await LFB.setSettings(readForm());
    flash("Saved");
  }

  // Auto-save on any input/change within the form.
  form.addEventListener("change", save);
  form.elements.customText.addEventListener("input", () => {
    // Debounce text input slightly.
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(save, 400);
  });

  resetBtn.addEventListener("click", async () => {
    const fresh = await LFB.resetSettings();
    fillForm(fresh);
    flash("Reset to defaults");
  });

  // Reflect external changes (e.g. pause from popup) without clobbering edits.
  LFB.onSettingsChanged((settings) => {
    if (document.activeElement === form.elements.customText) return;
    fillForm(settings);
  });

  LFB.getSettings().then(fillForm);
})();
