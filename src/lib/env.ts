import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

function loadEnvFile(path: string) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true });
  }
}

const moduleDir = dirname(fileURLToPath(import.meta.url));

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), "..", ".env"));
loadEnvFile(resolve(moduleDir, "..", "..", ".env"));
loadEnvFile(resolve(moduleDir, "..", "..", "..", ".env"));

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}
