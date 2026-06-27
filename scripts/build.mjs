#!/usr/bin/env node
/**
 * Build per-browser extension folders from the single shared source.
 *
 * Source of truth:  src/  icons/  + manifests/manifest.<base>.json
 * Output:           dist/firefox  dist/chrome  dist/edge  dist/safari
 *
 * Each output folder is a complete, loadable extension with the correct
 * manifest.json for that browser. No code is duplicated in the repo — the dist
 * folders are generated artifacts (git-ignore them).
 *
 * Usage:
 *   node scripts/build.mjs              # build all targets
 *   node scripts/build.mjs firefox      # build one target
 */
import { cp, mkdir, rm, copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// target -> which manifest base it uses.
// Edge is Chromium (same as Chrome). Safari consumes the Chrome-style manifest
// via Apple's safari-web-extension-converter.
const TARGETS = {
  firefox: "firefox",
  chrome: "chrome",
  edge: "chrome",
  safari: "chrome"
};

const SHARED = ["src", "icons"];

async function buildTarget(name) {
  const base = TARGETS[name];
  const manifestSrc = join(ROOT, "manifests", `manifest.${base}.json`);
  if (!existsSync(manifestSrc)) {
    throw new Error(`Missing manifest base: ${manifestSrc}`);
  }

  const outDir = join(ROOT, "dist", name);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Copy shared source trees.
  for (const dir of SHARED) {
    await cp(join(ROOT, dir), join(outDir, dir), { recursive: true });
  }

  // Drop in the browser-specific manifest as manifest.json.
  await copyFile(manifestSrc, join(outDir, "manifest.json"));

  // Sanity check: manifest must be valid JSON.
  JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));

  console.log(`✓ dist/${name}  (manifest base: ${base})`);
}

async function main() {
  const requested = process.argv.slice(2);
  const names = requested.length ? requested : Object.keys(TARGETS);

  for (const name of names) {
    if (!TARGETS[name]) {
      console.error(`Unknown target "${name}". Valid: ${Object.keys(TARGETS).join(", ")}`);
      process.exitCode = 1;
      continue;
    }
    await buildTarget(name);
  }

  // Friendly pointer file so dist/ isn't a mystery if committed.
  if (!requested.length) {
    await writeFile(
      join(ROOT, "dist", "README.md"),
      "# dist/ (generated)\n\n" +
        "These folders are produced by `npm run build` (scripts/build.mjs) from the\n" +
        "shared source in `src/` + `icons/` + `manifests/`. Do not edit them by hand —\n" +
        "edit the source and rebuild. Safe to delete; regenerate any time.\n\n" +
        "- `firefox/` — Load Temporary Add-on (about:debugging)\n" +
        "- `chrome/`  — Load unpacked (chrome://extensions)\n" +
        "- `edge/`    — Load unpacked (edge://extensions)\n" +
        "- `safari/`  — Input to `xcrun safari-web-extension-converter`\n"
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
