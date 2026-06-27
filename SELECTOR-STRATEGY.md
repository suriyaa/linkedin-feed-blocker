# Selector strategy

LinkedIn ships obfuscated, frequently-changing CSS class names (e.g.
`feed-shared-update-v2`, `ember1234`). Depending on those alone is fragile. This
extension uses **layered detection**, ordered from most stable to least, so that
when one layer breaks the others still hold.

## Layer 1 — URL / path (most stable, primary signal)

The home feed is identified purely by URL in `src/content/content.js`:

```js
// isHomeFeedUrl(): pathname is "", "/", or "/feed"
```

LinkedIn's home feed has lived at `/feed/` for years, and the bare domain
redirects there. This is the layer least likely to break and is what drives the
default home-feed block. Localized hosts (`xx.linkedin.com`) share the same path
structure, so they're covered automatically.

Post permalinks (`/feed/update/...`) are detected separately and only blocked
when **Strict mode** is enabled.

**If LinkedIn moves the feed path:** update `isHomeFeedUrl()` / `isFeedPermalink()`.

## Layer 2 — Semantic landmarks & ARIA (stable, structural)

For hiding/replacing the feed content we target roles and landmarks, not
generated classes. See `src/content/content.css` and `findFeedHost()`:

- `main[role="main"]` — the primary content region (the overlay is injected here).
- `aside[aria-label]` — recommendation rails (sidebar blocking).
- `div[data-finite-scroll-hotkey-context="FEED"]` — a stable-ish data attribute
  LinkedIn uses for the infinite feed container.

ARIA and landmark roles change far less often than visual class names because
they're tied to accessibility, not styling.

## Layer 3 — Semantic container heuristics (for optional surfaces)

"Suggested / promoted" hiding (`hideSuggestedModules()`) scans card-like
containers and matches a small set of **text/ARIA hints**
(`SUGGESTED_HINTS`: "promoted", "suggested", "people you may know", etc.) against
each node's `aria-label` or short header text only — never the full post body —
to avoid hiding genuine user posts that happen to mention those words.

Matched nodes get the `lfb-suggested-hidden` class (defined in CSS), so the
hiding logic and styling stay decoupled.

## Layer 4 — MutationObserver fallback (catches the rest)

LinkedIn is a single-page app: it re-renders and client-side-navigates without
full page loads. `startObserver()` watches `documentElement` and on every mutation:

1. Detects SPA navigation by comparing `location.href` to the last seen URL and
   recomputes from scratch.
2. Re-applies state classes, re-injects the overlay if LinkedIn replaced it, and
   re-scans for suggested modules.

This is the safety net that keeps blocking effective as the DOM churns.

## Flash prevention

The content script runs at `document_start` and, for the default-on case,
synchronously adds the `lfb-block-feed` class to `<html>` **before** settings
finish loading. `content.css` (also injected at `document_start`) hides the feed
the moment that class is present, so the feed never flashes. If the async settings
load reveals blocking is off/paused, the class is removed.

## How to update when LinkedIn changes its markup

1. **Feed still detected but overlay misplaced?** Inspect the page and update
   `findFeedHost()` / the `html.lfb-block-feed ...` selectors in `content.css`.
   Prefer `role`/`aria-label`/`data-*` attributes over class names.
2. **Sidebar not hidden?** Update the `html.lfb-block-sidebar` rules — check the
   current `aside` structure and any stable wrapper.
3. **Suggested items slipping through?** Add/adjust strings in `SUGGESTED_HINTS`
   in `content.js`, or broaden the `candidates` selector.
4. **Home feed not detected at all?** Re-check `isHomeFeedUrl()` against the new
   path.

Keep the layering: never replace a URL/role/ARIA check with a brittle class-only
selector, even if it's tempting in the moment.
