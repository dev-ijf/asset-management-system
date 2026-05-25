import { cp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "src/.next");
const destination = resolve(root, ".next");

async function findFiles(directory, suffix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findFiles(path, suffix));
      continue;
    }

    if (entry.name.endsWith(suffix)) {
      files.push(path);
    }
  }

  return files;
}

function normalizeExternalTracePath(file) {
  if (!file.startsWith("../")) {
    return file;
  }

  const externalMarkers = [
    "node_modules/",
    ".env",
    ".env.local",
    ".env.production",
    "package.json",
    "package-lock.json",
    "prisma/",
    "src/generated/",
  ];

  if (!externalMarkers.some((marker) => file.includes(marker))) {
    return file;
  }

  return file.replace(/^\.\.\//, "");
}

async function normalizeTraceFiles() {
  const traceFiles = await findFiles(destination, ".nft.json");

  for (const traceFile of traceFiles) {
    const trace = JSON.parse(await readFile(traceFile, "utf8"));

    if (!Array.isArray(trace.files)) {
      continue;
    }

    trace.files = trace.files.map(normalizeExternalTracePath);
    await writeFile(traceFile, `${JSON.stringify(trace)}\n`);
  }
}

await rm(destination, { force: true, recursive: true });
await cp(source, destination, { recursive: true });
await normalizeTraceFiles();

console.log("Synced Next.js build output from src/.next to .next for Vercel.");
