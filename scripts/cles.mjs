#!/usr/bin/env node
/**
 * Push the owner's private key card (~/.blackway/cles-blackway.env) to blackway-pipe secrets.
 * The card never lives in the repo. Only allow-listed names are sent.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const CARD = join(homedir(), ".blackway", "cles-blackway.env");
const ALLOWED = new Set(["PADDLE_API_KEY", "PADDLE_WEBHOOK_SECRET", "HUBSPOT_TOKEN", "HUBSPOT_SYNC"]);

if (!existsSync(CARD)) {
  console.error(`Carte introuvable : ${CARD}`);
  process.exit(1);
}

const secrets = {};
for (const raw of readFileSync(CARD, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 1) continue;
  const name = line.slice(0, i).trim();
  const value = line.slice(i + 1).trim();
  if (!ALLOWED.has(name)) {
    console.warn(`Ignoree (nom inconnu) : ${name}`);
    continue;
  }
  if (value) secrets[name] = value;
}

const names = Object.keys(secrets);
if (!names.length) {
  console.error("Aucune cle remplie dans la carte.");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "bw-cles-"));
const file = join(dir, "secrets.json");
try {
  writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  execFileSync("npx", ["wrangler", "secret", "bulk", file], {
    cwd: new URL("../pipe/", import.meta.url),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const health = await fetch("https://api.blackwayconnect.com/health").then((r) => r.json()).catch(() => null);
console.log(`\nInstallees : ${names.join(", ")}`);
if (health) {
  console.log(`Production : paddle_api_key=${health.paddle_api_key} paddle_webhook_secret=${health.paddle_webhook_secret} (quelques secondes de propagation)`);
}
