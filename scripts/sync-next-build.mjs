import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "src/.next");
const destination = resolve(root, ".next");

await rm(destination, { force: true, recursive: true });
await cp(source, destination, { recursive: true });

console.log("Synced Next.js build output from src/.next to .next for Vercel.");
