# Contributing to LinkedIn Feed Blocker

Thanks for your interest in improving LinkedIn Feed Blocker. This is a small,
dependency-free WebExtension, so contributing is intentionally low-friction.

## Project principles

Keep changes aligned with the project's goals:

- **Privacy first** — no analytics, no tracking, no remote code, no data
  collection. Settings stay in `browser.storage.local` only.
- **Minimum permissions** — `storage` + host access scoped to
  `*://*.linkedin.com/*`. Don't add permissions without a strong, documented
  reason.
- **Resilience over cleverness** — prefer URL/path checks, ARIA, landmarks, and
  semantic heuristics over fragile generated class names. See
  [SELECTOR-STRATEGY.md](SELECTOR-STRATEGY.md).
- **Cross-browser** — code must work on Firefox (reference), Chrome, and Edge,
  and stay portable to Safari. Always use the `browser.*` API (the shim aliases
  `chrome.*`); avoid browser-specific APIs.
- **Plain JS/HTML/CSS** — no frameworks, no bundler, no runtime dependencies.

## Repository layout

The single source of truth is `src/` + `icons/` + `manifests/`. The per-browser
folders in `dist/` are **generated** — never edit them by hand.

```
src/        shared source (edit here)
manifests/  per-browser manifest.json templates
scripts/    build.mjs, zip.mjs, make-icons.py
dist/       generated, git-ignored
```

## Getting started

No `npm install` is required — the scripts use only Node's standard library plus
system `zip`/`python3`.

```bash
npm run build          # build dist/firefox, dist/chrome, dist/edge, dist/safari
npm run build:firefox  # build a single target
npm run clean          # remove dist/
npm run icons          # regenerate placeholder icons
```

Load the relevant `dist/<browser>/` folder as a temporary/unpacked extension
(see [README.md](README.md) for per-browser steps).

## Development workflow

1. **Fork and branch.** Create a feature branch off `main`
   (`git checkout -b fix/feed-selector`).
2. **Edit the source** under `src/` / `manifests/` — never `dist/`.
3. **Rebuild** with `npm run build` and reload the extension.
4. **Lint** the Firefox build:
   ```bash
   npx web-ext lint --source-dir dist/firefox
   ```
   Aim for zero errors and zero warnings.
5. **Test manually** against [TEST-PLAN.md](TEST-PLAN.md) — at minimum the
   sections your change touches, plus the Easy/Strict mode checks.
6. **Open a pull request** with a clear description of what changed and why.

## Coding style

- Match the surrounding code: 2-space indentation, semicolons, double quotes.
- Keep functions small and named for what they do.
- Comment **why**, not what — especially around selector choices, since LinkedIn's
  DOM changes often.
- Use `browser.*`, never `chrome.*`, in feature code.
- Don't introduce `localStorage` / `sessionStorage` for persisted state — use the
  extension storage helpers in `src/lib/storage.js`.

## Updating selectors when LinkedIn changes

LinkedIn ships DOM changes frequently. If blocking breaks:

1. Read [SELECTOR-STRATEGY.md](SELECTOR-STRATEGY.md) first.
2. Prefer the most stable layer that fixes it (URL > role/ARIA > data attrs >
   text heuristics > class names).
3. Add a short comment explaining the new selector and what it targets.
4. Note the LinkedIn change in your PR so reviewers understand the context.

## Pull request checklist

- [ ] Edited `src/` / `manifests/`, not `dist/`.
- [ ] `npm run build` succeeds for all targets.
- [ ] `npx web-ext lint --source-dir dist/firefox` is clean.
- [ ] Manually tested the affected behavior (note which sections of TEST-PLAN.md).
- [ ] No new permissions, dependencies, or remote code (or clearly justified).
- [ ] Docs updated if behavior/settings changed (README, TEST-PLAN, etc.).

## Reporting bugs and requesting features

Open an issue describing:

- Browser + version, and OS.
- What you expected vs. what happened.
- Steps to reproduce (a LinkedIn URL pattern helps).
- Console errors (any line mentioning `lfb`), if relevant.

For **security issues, do not open a public issue** — see
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the same
license as this project: the **GNU General Public License v3.0 or later**
(GPL-3.0-or-later). See [LICENSE.md](LICENSE.md).
