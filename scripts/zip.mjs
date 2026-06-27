#!/usr/bin/env node
/**
 * Zip each built dist/<browser> folder into dist/<browser>.zip for distribution
 * / store upload. Firefox's becomes a .xpi-ready zip; Chrome/Edge upload the zip
 * directly; Safari uses the folder (not the zip) as converter input.
 *
 * Uses the system `zip` (present on macOS/Linux). Run `npm run build` first.
 */
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

if (!existsSync(DIST)) {
  console.error("No dist/ - run `npm run build` first.");
  process.exit(1);
}

const entries = await readdir(DIST);
for (const name of entries) {
  const dir = join(DIST, name);
  if (!(await stat(dir)).isDirectory()) continue;
  const zipPath = join(DIST, `${name}.zip`);
  // -r recurse, -X strip extra attrs, -FS sync; run inside the folder so paths
  // are relative to the extension root (required by stores).
  execFileSync("zip", ["-r", "-X", "-FS", zipPath, "."], {
    cwd: dir,
    stdio: "inherit"
  });
  console.log(`✓ ${zipPath}`);
}
