# LinkedIn Feed Blocker

A small, privacy-respecting WebExtension that hides LinkedIn's addictive home
feed and replaces it with a calm card — while keeping the genuinely useful parts
of LinkedIn (messaging, notifications, search, jobs, profiles, company pages,
and direct post links) fully working.

Built **Firefox-first**, compatible with **Chrome** and **Edge** (Manifest V3),
and structured for easy porting to a **Safari Web Extension**.

---

## What it does

When you open `linkedin.com` or `linkedin.com/feed/`, the extension:

- Hides the main feed column immediately (before it can flash into view).
- Drops a clean replacement card in its place: **"LinkedIn feed blocked"** plus
  an optional customizable line (default: *"Use LinkedIn intentionally."*).
- Offers quick actions: **Jobs**, **Messaging**, **Notifications**,
  **My Network**, **Pause N minutes**, **Disable on this page once**, and
  **Settings**.

The top navigation bar stays intact, so the rest of LinkedIn is one click away.

## Features

- **On by default**, in Easy mode.
- **Two modes:**
  - **Easy** — blocks only the center home feed; keeps the left + right sidebars.
  - **Strict** — also hides both sidebars, suggested/promoted modules, and
    individual feed post permalinks (`/feed/update/...`).
- **Popup** — current status, master enable/disable, Easy/Strict switch, pause
  for 10 min / 30 min / 1 hour, resume now, open settings.
- **Options page:**
  - Blocking mode (Easy / Strict)
  - Show replacement message + custom text
  - Default temporary-pause duration
- **Temporary pause** with timestamp logic (survives reloads until it expires).
- **Per-page "disable once"** (resets on reload — by design).
- **Resilient detection** — URL/path first, then semantic landmarks/ARIA, with a
  MutationObserver fallback for LinkedIn's single-page-app re-renders.
- **Accessible** — keyboard-navigable popup/options, semantic HTML, visible
  focus states, ARIA labels. Light-themed UI to match LinkedIn's light mode.

## Privacy & security

- **No analytics, no tracking, no data collection, no remote code.**
- Settings live in extension storage only (`browser.storage.local`).
- **Minimum permissions:** `storage` + host access scoped to
  `*://*.linkedin.com/*`. Nothing else.
- No `localStorage` / `sessionStorage` is used for persisted state.

## Permissions explained

| Permission                  | Why                                                        |
| --------------------------- | ---------------------------------------------------------- |
| `storage`                   | Persist your settings and the pause-until timestamp.       |
| `*://*.linkedin.com/*` host | Run the content script that hides the feed, on LinkedIn only. |

No `tabs`, no `scripting`, no broad `<all_urls>` — the content script is declared
statically in the manifest and only matches LinkedIn.

---

## Project structure

**One shared source, per-browser builds.** Source of truth is `src/` + `icons/`
+ `manifests/`. A tiny build script copies them into `dist/<browser>/` with the
correct `manifest.json` for each browser — so there is no duplicated code to keep
in sync.

```
linkedin-feed-blocker/
├── src/                          # ── SHARED SOURCE (edit here) ──
│   ├── background/background.js   # seeds defaults, opens options page
│   ├── content/
│   │   ├── content.js             # core blocking logic + overlay + observer
│   │   └── content.css            # state-class-gated hide rules + overlay styles
│   ├── popup/   {popup.html, popup.css, popup.js}
│   ├── options/ {options.html, options.css, options.js}
│   └── lib/
│       ├── browser-polyfill.js    # tiny `browser ||= chrome` shim
│       ├── defaults.js            # default settings + constants
│       └── storage.js             # promise-based storage helpers (global `LFB`)
├── icons/                         # PNG placeholders (16/32/48/128) + README
├── manifests/                    # ── PER-BROWSER MANIFESTS ──
│   ├── manifest.firefox.json      # background.scripts + gecko settings
│   └── manifest.chrome.json       # background.service_worker (also Edge/Safari)
├── scripts/
│   ├── build.mjs                  # assembles dist/<browser>/ from shared source
│   ├── zip.mjs                    # zips each dist folder for store upload
│   └── make-icons.py              # regenerate placeholder icons (stdlib only)
├── dist/                         # ── GENERATED (git-ignored) ──
│   ├── firefox/   chrome/   edge/   safari/   # complete, loadable extensions
├── package.json                  # build / zip npm scripts
├── README.md
├── SELECTOR-STRATEGY.md           # how feed detection works / how to update it
└── TEST-PLAN.md                   # manual test checklist
```

Plain JS/HTML/CSS, no dependencies. The only "build" is a copy step (Node, no
bundler) that produces the per-browser folders.

### Build the per-browser folders

```bash
npm run build              # builds dist/firefox, dist/chrome, dist/edge, dist/safari
npm run build:firefox      # or build a single target
npm run zip                # build + zip each folder into dist/<browser>.zip
npm run icons              # regenerate placeholder icons
npm run clean              # remove dist/
```

(No `npm install` needed — the scripts use only Node's standard library + system
`zip`/`python3`.)

---

## Load it locally

Run `npm run build` first — it creates the `dist/<browser>/` folders you load.

### Firefox (reference implementation)

1. `npm run build:firefox` (or `npm run build`).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Select `dist/firefox/manifest.json`.
5. Open `https://www.linkedin.com/feed/` — the feed should be replaced.

Temporary add-ons are removed when Firefox restarts. For a persistent install,
package and sign via [AMO](https://addons.mozilla.org/) or use Developer Edition
with `xpinstall.signatures.required = false`.

To package a signable/zip artifact for AMO:

```bash
npm run zip        # produces dist/firefox.zip (rename to .xpi for local use)
```

### Chrome (Manifest V3)

1. `npm run build:chrome`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the **`dist/chrome`** folder.
5. Open `https://www.linkedin.com/feed/`.

### Edge (Manifest V3)

1. `npm run build:edge`.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the **`dist/edge`** folder.

**Chromium notes (Chrome + Edge):**

- These targets use `background.service_worker` (the Firefox build uses
  `background.scripts`) — each is generated from its own manifest in `manifests/`.
- `browser.*` is aliased to `chrome.*` by `src/lib/browser-polyfill.js`. The APIs
  used (`storage`, `runtime`, `action`) are promise-based in Chrome MV3.
- Icons are PNG, which Chrome/Edge require for the toolbar action.

### Safari (Web Extension)

Safari supports WebExtensions but requires wrapping the extension in a macOS/iOS
app project via Apple's converter. Use the generated **`dist/safari`** folder
(Chrome-style manifest, which the converter expects) as input.

1. `npm run build:safari` and install Xcode + command line tools.
2. Run:

   ```bash
   xcrun safari-web-extension-converter dist/safari --project-location ../safari-build --app-name "LinkedIn Feed Blocker"
   ```

3. Open the generated Xcode project, build, and run.
4. In Safari: **Settings → Advanced → Show features for web developers**, then
   **Settings → Developer → Allow unsigned extensions** (per session), and enable
   the extension under **Settings → Extensions**.

**Safari caveats (read these):**

- **Signing for distribution** requires an Apple Developer account; the converter
  output is a full app you must sign and (for the App Store) submit.
- The `dist/safari` build uses the Chrome-style manifest (`background.service_worker`,
  no `gecko` key), which is exactly what the converter expects — no manual editing.
- Safari's background is an **event page / service worker**; the tiny background
  script here is compatible.
- **`prefers-color-scheme`** and the overlay render fine, but test the overlay
  position on Safari since its layout timing for SPA apps can differ slightly.
- Safari is stricter about **host permission prompts** — the user must grant
  access to linkedin.com the first time.
- Unsigned-extension permission resets on Safari restart during development.

The codebase avoids browser-specific APIs precisely so this conversion stays
mechanical. If you change code, keep using `browser.*` (not `chrome.*`) and avoid
Chrome-only APIs to preserve Safari portability.

---

## Known limitations

- LinkedIn is a fast-changing single-page app. If they significantly restructure
  the feed DOM, the overlay placement or sidebar/suggested hiding may need
  selector updates — see [`SELECTOR-STRATEGY.md`](SELECTOR-STRATEGY.md). The
  URL-based home-feed detection is the most durable part and rarely breaks.
- "Suggested / promoted" detection uses text/ARIA heuristics; LinkedIn
  occasionally localizes or relabels these, so a few items may slip through or,
  rarely, a false positive may hide a legitimate card. It's off by default.
- "Disable on this page once" is intentionally per-page-load and resets on
  reload.
- The extension only acts on `*.linkedin.com`; it does nothing elsewhere.
- Placeholder icons are functional but not designed art — replace before
  publishing.

---

## Continuous delivery (auto build + sign)

`.github/workflows/release.yml` runs on every push to `main` and:

1. **Bumps the version** (AMO requires a unique version per upload). The level
   comes from the head commit message:
   - `[major]` or `BREAKING CHANGE` → `X.0.0`
   - `[minor]` or a `feat:` prefix → `x.X.0`
   - anything else → `x.x.X` (patch, default)
2. Builds the Firefox target and lints it (`web-ext lint`).
3. **Signs** it via AMO (`web-ext sign`, unlisted channel).
4. Commits the bump back (`chore: release vX.Y.Z [skip ci]`).
5. Tags it and publishes a **GitHub Release** with the signed `.xpi` attached.

### One-time setup

Create a GitHub **Environment** named `amo`
(`Settings → Environments → New environment`) and add two secrets:

| Secret | Value |
| ------ | ----- |
| `WEB_EXT_API_KEY` | JWT issuer from <https://addons.mozilla.org/developers/addon/api/key/> |
| `WEB_EXT_API_SECRET` | JWT secret (same AMO account that owns the add-on) |

Use the **same AMO account** that owns the add-on id
(`linkedin-feed-blocker@local.extension`), or signing will fail.

You can also bump locally without CI:

```bash
npm run bump            # patch (default)
npm run bump minor
npm run bump major
```

## License

Licensed under the **GNU General Public License v3.0 or later**
(GPL-3.0-or-later), the same license used by uBlock Origin. See
[LICENSE.md](LICENSE.md) for the full text.

© 2026–present [Suriyaa Sundararuban](https://www.suriyaasundararuban.com/).

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md). Contributions are
welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
