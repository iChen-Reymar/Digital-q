import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnv(filename = ".env.local") {
  loadEnvFile(".env", false);
  if (filename !== ".env") loadEnvFile(filename, true);
}

function loadEnvFile(filename, override) {
  const path = resolve(filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) process.env[key] = value;
  }
}
