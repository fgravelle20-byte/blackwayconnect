/**
 * Force-correct local Supabase URL + classic JWT keys into apps/web/.env.local
 * Prefer ANON_KEY / SERVICE_ROLE_KEY from `supabase status -o env` (JWT),
 * not sb_publishable / sb_secret.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "apps", "web", ".env.local");

function parseEnv(text) {
  const out = {};
  // Join soft-wrapped JWT lines from some terminals
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n(?=[^A-Z_])/g, "");
  for (const line of normalized.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    // Deduplicate accidental concatenation (value repeated twice)
    if (v.length > 0 && v.length % 2 === 0) {
      const half = v.slice(0, v.length / 2);
      if (half === v.slice(v.length / 2)) v = half;
    }
    out[m[1]] = v;
  }
  return out;
}

function upsertEnvFile(filePath, updates) {
  let raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = raw.length ? raw.split(/\r?\n/) : [];
  const pending = { ...updates };
  const next = lines.map((line) => {
    const m = line.match(/^([A-Za-z0-9_]+)=/);
    if (m && pending[m[1]] !== undefined) {
      const k = m[1];
      const v = pending[k];
      delete pending[k];
      return `${k}=${v}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(pending)) next.push(`${k}=${v}`);
  fs.writeFileSync(
    filePath,
    `${next.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n")}\n`,
  );
}

const status = execSync("npx supabase status -o env", {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});
const env = parseEnv(status);
let apiUrl = env.API_URL || env.SUPABASE_URL || "http://127.0.0.1:54321";
let anon = env.ANON_KEY || env.SUPABASE_ANON_KEY;
let service = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

// Local demo JWTs (classic) — required by @supabase/supabase-js
const DEMO_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const DEMO_SERVICE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!anon || anon.startsWith("sb_") || anon.length !== DEMO_ANON.length) anon = DEMO_ANON;
if (!service || service.startsWith("sb_") || service.length !== DEMO_SERVICE.length) {
  service = DEMO_SERVICE;
}
if (apiUrl.includes("http://") && apiUrl.indexOf("http://", 1) !== -1) {
  apiUrl = "http://127.0.0.1:54321";
}

upsertEnvFile(envPath, {
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  SUPABASE_SERVICE_ROLE_KEY: service,
});

console.log("Fixed Supabase keys → apps/web/.env.local");
console.log(`  URL=${apiUrl} (len=${apiUrl.length})`);
console.log(`  ANON_KEY len=${anon.length}`);
console.log(`  SERVICE_ROLE_KEY len=${service.length}`);
