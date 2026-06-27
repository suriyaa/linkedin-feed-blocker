#!/usr/bin/env node
/**
 * Bump the extension version across all files that carry it.
 *
 *   node scripts/bump-version.mjs [major|minor|patch]   (default: patch)
 *
 * Reads the current version from package.json, computes the next one, and
 * rewrites the "version" field in:
 *   - package.json
 *   - manifests/manifest.firefox.json
 *   - manifests/manifest.chrome.json
 *
 * Uses a targeted regex replace so the rest of each file's formatting (blank
 * lines, key order) is preserved. Prints the new version to stdout.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "package.json",
  "manifests/manifest.firefox.json",
  "manifests/manifest.chrome.json"
];

const level = (process.argv[2] || "patch").toLowerCase();
if (!["major", "minor", "patch"].includes(level)) {
  console.error(`Invalid level "${level}". Use major | minor | patch.`);
  process.exit(1);
}

const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
const m = String(pkg.version).match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!m) {
  console.error(`Cannot parse current version "${pkg.version}".`);
  process.exit(1);
}
let [maj, min, pat] = m.slice(1).map(Number);
if (level === "major") {
  maj += 1;
  min = 0;
  pat = 0;
} else if (level === "minor") {
  min += 1;
  pat = 0;
} else {
  pat += 1;
}
const next = `${maj}.${min}.${pat}`;

for (const rel of FILES) {
  const path = join(ROOT, rel);
  const text = await readFile(path, "utf8");
  // Replace only the first "version": "..." occurrence.
  const updated = text.replace(
    /("version"\s*:\s*")\d+\.\d+\.\d+(")/,
    `$1${next}$2`
  );
  if (updated === text) {
    console.error(`Warning: no version field updated in ${rel}`);
  }
  await writeFile(path, updated);
}

console.log(next);
