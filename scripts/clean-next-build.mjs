import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const buildDirectories = [resolve(root, ".next"), resolve(root, "src/.next")];

for (const directory of buildDirectories) {
  await rm(directory, { force: true, recursive: true });
}

console.log("Cleaned stale Next.js build directories.");
