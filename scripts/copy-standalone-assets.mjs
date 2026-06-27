import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = join(root, ".next", "standalone");

const assets = [
  {
    from: join(root, ".next", "static"),
    to: join(standaloneRoot, ".next", "static"),
  },
  {
    from: join(root, "public"),
    to: join(standaloneRoot, "public"),
  },
];

if (!existsSync(standaloneRoot)) {
  throw new Error("Standalone output was not found. Run `next build` before copying assets.");
}

for (const asset of assets) {
  if (!existsSync(asset.from)) {
    continue;
  }

  rmSync(asset.to, { force: true, recursive: true });
  mkdirSync(dirname(asset.to), { recursive: true });
  cpSync(asset.from, asset.to, { recursive: true });
}

console.log("Standalone static assets copied.");
