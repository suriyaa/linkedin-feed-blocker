/**
 * LinkedIn Feed Blocker — content script.
 *
 * Runs at document_start on linkedin.com. Responsibilities:
 *   1. Detect feed/home URLs as early as possible and pre-hide the feed (no flash).
 *   2. Load settings, then decide whether to keep blocking (respecting pause /
 *      master switch / per-page "disable once").
 *   3. Inject a calm replacement overlay with quick actions.
 *   4. Re-apply on SPA navigation + dynamic re-renders via a MutationObserver.
 *   5. Optionally blank sidebar / suggested / strict feed-like surfaces.
 *
 * Selector strategy (resilient by design — see README "Selector strategy"):
 *   - URL/path checks are the primary, most stable signal for the home feed.
 *   - DOM targeting prefers semantic landmarks (main[role="main"], aside[aria-label])
 *     and stable data attributes over fragile generated class names.
 *   - The MutationObserver is the fallback that re-hides anything LinkedIn
 *     re-renders, and re-evaluates the page after client-side navigations.
 */
(function () {
  "use strict";

  const ROOT = document.documentElement;

  // Per-page-load opt-out ("Disable on this page once"). In-memory only by
  // design: it must reset on reload, so it intentionally uses no storage.
  let disabledForThisLoad = false;

  let settings = Object.assign({}, globalThis.LFB_DEFAULTS);
  let observer = null;
  let lastUrl = location.href;

  /* ------------------------------------------------------------------ *
   * URL detection
   * ------------------------------------------------------------------ */

  /**
   * True when the current URL is the addictive home feed.
   * LinkedIn's home feed lives at /feed/ (the bare domain redirects there).
   * We avoid matching /feed/update/... permalinks unless strict mode is on.
   */
  function isHomeFeedUrl(url) {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return false;
    }
    const p = u.pathname.replace(/\/+$/, ""); // trim trailing slash
    // Home feed: "", "/", or "/feed". Localized hosts (xx.linkedin.com) share
    // the same path structure, so host-language variants are covered.
    return p === "" || p === "/feed";
  }

  /** Individual post permalink — only blocked when strict mode is on. */
  function isFeedPermalink(url) {
    try {
      return /\/feed\/update\//.test(new URL(url).pathname);
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ *
   * Decision
   * ------------------------------------------------------------------ */

  function blockingActive() {
    if (disabledForThisLoad) return false;
    if (!settings.enabled) return false;
    if (LFB.isPaused(settings)) return false;
    return true;
  }

  function isStrict() {
    return settings.mode === "strict";
  }

  function shouldBlockHomeFeed() {
    if (!blockingActive()) return false;
    // Both modes block the center home feed.
    if (isHomeFeedUrl(location.href)) return true;
    // Strict mode additionally blocks individual feed post permalinks.
    if (isStrict() && isFeedPermalink(location.href)) return true;
    return false;
  }

  /* ------------------------------------------------------------------ *
   * State classes (drive content.css)
   * ------------------------------------------------------------------ */

  function syncStateClasses() {
    const active = blockingActive();
    const strict = active && isStrict();
    ROOT.classList.toggle("lfb-block-feed", shouldBlockHomeFeed());
    // Sidebar + suggested hiding only in strict mode. Easy mode keeps the rails.
    ROOT.classList.toggle("lfb-block-sidebar", strict);
    ROOT.classList.toggle("lfb-block-suggested", strict);
    ROOT.classList.toggle("lfb-strict", strict);
  }

  /* ------------------------------------------------------------------ *
   * Overlay
   * ------------------------------------------------------------------ */

  const OVERLAY_ID = "lfb-overlay-root";

  const QUICK_LINKS = [
    { label: "Jobs", href: "/jobs/", icon: "💼" },
    { label: "Messaging", href: "/messaging/", icon: "✉️" },
    { label: "Notifications", href: "/notifications/", icon: "🔔" },
    { label: "My Network", href: "/mynetwork/", icon: "👥" }
  ];

  function buildOverlay() {
    const card = document.createElement("section");
    card.className = "lfb-overlay";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "LinkedIn feed blocked");

    const badge = document.createElement("div");
    badge.className = "lfb-overlay__badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = "✓";
    card.appendChild(badge);

    const title = document.createElement("h2");
    title.className = "lfb-overlay__title";
    title.textContent = "LinkedIn feed blocked";
    card.appendChild(title);

    if (settings.showMessage && settings.customText) {
      const sub = document.createElement("p");
      sub.className = "lfb-overlay__subtitle";
      sub.textContent = settings.customText;
      card.appendChild(sub);
    }

    // Quick navigation actions.
    const actions = document.createElement("nav");
    actions.className = "lfb-overlay__actions";
    actions.setAttribute("aria-label", "Quick links");
    for (const link of QUICK_LINKS) {
      const a = document.createElement("a");
      a.className = "lfb-overlay__action";
      a.href = link.href;
      a.innerHTML = ""; // build via DOM to avoid injecting markup
      const ic = document.createElement("span");
      ic.setAttribute("aria-hidden", "true");
      ic.textContent = link.icon;
      const tx = document.createElement("span");
      tx.textContent = link.label;
      a.appendChild(ic);
      a.appendChild(tx);
      actions.appendChild(a);
    }
    card.appendChild(actions);

    // Secondary actions.
    const secondary = document.createElement("div");
    secondary.className = "lfb-overlay__secondary";

    // Easy mode offers escape hatches. Strict mode deliberately omits them — the
    // whole point of strict is no quick way out. Settings stays so the user can
    // still switch back to easy.
    if (!isStrict()) {
      secondary.appendChild(
        makeButton(
          `Pause ${settings.pauseDurationMinutes} min`,
          () => pauseFor(settings.pauseDurationMinutes)
        )
      );
      secondary.appendChild(
        makeButton("Disable on this page once", () => {
          disabledForThisLoad = true;
          update();
        })
      );
    }
    secondary.appendChild(
      makeButton("Settings", () => {
        try {
          browser.runtime.sendMessage({ type: "lfb-open-options" });
        } catch (e) {
          /* background may be asleep; ignore */
        }
      })
    );

    card.appendChild(secondary);
    return card;
  }

  function makeButton(label, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lfb-overlay__link";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  /**
   * Find the container the overlay should live inside (the old feed slot).
   * Must be the center column. We DO NOT fall back to <body>: putting the card
   * in body drops it at the bottom of the page. If <main> isn't ready yet we
   * return null and the MutationObserver retries once it appears.
   */
  function findFeedHost() {
    return (
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      null
    );
  }

  function ensureOverlay() {
    const host = findFeedHost();
    if (!host) return; // DOM not ready yet; observer will retry

    let wrapper = document.getElementById(OVERLAY_ID);
    if (wrapper) {
      // Overlay exists. LinkedIn (SPA) may have re-rendered <main> as a new
      // node, leaving our overlay detached or in a stale parent — re-home it.
      if (wrapper.parentNode !== host) host.appendChild(wrapper);
      return;
    }

    wrapper = document.createElement("div");
    wrapper.id = OVERLAY_ID;
    wrapper.appendChild(buildOverlay());
    host.appendChild(wrapper);
  }

  function removeOverlay() {
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  }

  function refreshOverlayContent() {
    // Rebuild if settings affecting text changed while overlay is shown.
    const el = document.getElementById(OVERLAY_ID);
    if (!el) return;
    el.replaceChildren(buildOverlay());
  }

  /* ------------------------------------------------------------------ *
   * Optional surfaces — suggested / promoted posts + strict feed modules
   * ------------------------------------------------------------------ */

  // Text fragments that mark promoted / suggested / recommendation modules.
  // Matched case-insensitively against aria-labels and small header text only,
  // so we don't accidentally hide a user's real post that mentions these words.
  const SUGGESTED_HINTS = [
    "promoted",
    "suggested",
    "recommended for you",
    "people you may know",
    "add to your feed"
  ];

  function hideSuggestedModules() {
    if (!blockingActive()) return;
    if (!isStrict()) return; // suggested/promoted hiding is a strict-mode feature

    // Scan feed list items / cards. Prefer semantic-ish containers.
    const candidates = document.querySelectorAll(
      '[data-id^="urn:li:activity"], div.feed-shared-update-v2, li.artdeco-card, section'
    );
    for (const node of candidates) {
      if (node.classList.contains("lfb-suggested-hidden")) continue;
      const label = (
        node.getAttribute("aria-label") ||
        (node.querySelector('[aria-hidden="true"], header, h2, h3')
          ? node.querySelector('[aria-hidden="true"], header, h2, h3').textContent
          : "") ||
        ""
      )
        .toLowerCase()
        .slice(0, 120); // cap to avoid scanning huge post bodies
      if (SUGGESTED_HINTS.some((h) => label.includes(h))) {
        node.classList.add("lfb-suggested-hidden");
      }
    }
  }

  /** Restore any nodes we previously hid (e.g. after pause / switch to easy). */
  function unhideSuggestedModules() {
    const hidden = document.querySelectorAll(".lfb-suggested-hidden");
    for (const node of hidden) node.classList.remove("lfb-suggested-hidden");
  }

  /* ------------------------------------------------------------------ *
   * Main update loop
   * ------------------------------------------------------------------ */

  function update() {
    syncStateClasses();

    if (shouldBlockHomeFeed()) {
      ensureOverlay();
    } else {
      removeOverlay();
    }

    // Strict mode hides suggested/promoted modules; otherwise make sure any
    // previously-hidden nodes are restored (pause, disable-once, easy mode).
    if (blockingActive() && isStrict()) {
      hideSuggestedModules();
    } else {
      unhideSuggestedModules();
    }
  }

  /* ------------------------------------------------------------------ *
   * Pause helper
   * ------------------------------------------------------------------ */

  async function pauseFor(minutes) {
    const until = Date.now() + minutes * 60 * 1000;
    await LFB.setSettings({ pausedUntil: until });
    // storage.onChanged will fire update(); also update now for snappiness.
  }

  /* ------------------------------------------------------------------ *
   * Observers
   * ------------------------------------------------------------------ */

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      // Detect SPA navigation (LinkedIn is a single-page app).
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        removeOverlay(); // URL changed; recompute from scratch
      }
      update();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  // 1. Pre-hide synchronously (no await) for the default-on case to kill flash.
  //    Both modes block the home feed, so pre-hide whenever we're on it.
  //    If the user has turned blocking off/paused, the async load below removes it.
  if (isHomeFeedUrl(location.href)) {
    ROOT.classList.add("lfb-block-feed");
  }

  // 2. Load real settings, then run the full loop.
  LFB.getSettings().then((loaded) => {
    settings = loaded;
    update();
    startObserver();
  });

  // 3. React to settings changes from popup / options / pause expiry.
  LFB.onSettingsChanged((next) => {
    settings = next;
    update();
    refreshOverlayContent();
  });

  // 4. When the page becomes visible again, a pause may have expired — re-check.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
})();
