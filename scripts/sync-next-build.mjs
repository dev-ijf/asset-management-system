import { cp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

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

function rootRelativePath(traceFile, target) {
  const traceDirectory = dirname(traceFile);
  return relative(traceDirectory, resolve(root, target)).replaceAll(sep, "/");
}

function normalizeExternalTracePath(traceFile, file) {
  if (
    file === ".env" ||
    file === ".env.local" ||
    file === ".env.production" ||
    file.endsWith("/.env") ||
    file.endsWith("/.env.local") ||
    file.endsWith("/.env.production")
  ) {
    return null;
  }

  if (file === "package.json" || (file.endsWith("/package.json") && !file.includes("node_modules/"))) {
    return rootRelativePath(traceFile, "package.json");
  }

  if (file === "package-lock.json" || (file.endsWith("/package-lock.json") && !file.includes("node_modules/"))) {
    return rootRelativePath(traceFile, "package-lock.json");
  }

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

    trace.files = [...new Set(trace.files.map((file) => normalizeExternalTracePath(traceFile, file)).filter(Boolean))];
    await writeFile(traceFile, `${JSON.stringify(trace)}\n`);
  }
}

await rm(destination, { force: true, recursive: true });
await cp(source, destination, { recursive: true });
await normalizeTraceFiles();

console.log("Synced Next.js build output from src/.next to .next for Vercel.");
