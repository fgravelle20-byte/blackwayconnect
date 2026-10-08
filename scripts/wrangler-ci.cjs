#!/usr/bin/env node
/**
 * Cloudflare production redeploy trigger.
 * Cloudflare Workers Builds wrapper.
 *
 * Responsibilities:
 * 1) Select the correct Wrangler config for monorepo workers.
 * 2) Ensure the frontend is built before Cloudflare deploy/preview commands.
 * 3) Guard production: if Cloudflare is misconfigured to run `wrangler preview`
 *    on the production branch, promote that invocation to `wrangler deploy`.
 */
"use strict";

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const wranglerCli = path.join(
  repoRoot,
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);
if (!fs.existsSync(wranglerCli)) {
  console.error("wrangler-ci: wrangler binary not found at", wranglerCli);
  process.exit(1);
}

const CONFIG_BY_WORKER = {
  "blackway-pipe": "pipe/wrangler.jsonc",
  "blackway-sentinel": "sentinel/wrangler.jsonc",
};

const args = process.argv.slice(2);
const worker = process.env.WRANGLER_CI_OVERRIDE_NAME;
const inWorkersCi = process.env.WORKERS_CI === "1";
const branch = process.env.WORKERS_CI_BRANCH || "";

function gitSha(ref) {
  try {
    const out = spawnSync("git", ["rev-parse", ref], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    if (out.status === 0) return String(out.stdout || "").trim();
  } catch {
    // ignore; env fallback below
  }
  return "";
}

const headSha = process.env.WORKERS_CI_COMMIT_SHA || gitSha("HEAD");
const mainSha = gitSha("refs/remotes/origin/main") || gitSha("origin/main");
const isProductionBranch =
  branch === "main" ||
  (!!headSha && !!mainSha && headSha === mainSha);

console.error(
  `wrangler-ci: branch=${branch || "<unset>"} head=${headSha.slice(0, 12) || "<unset>"} main=${mainSha.slice(0, 12) || "<unset>"} production=${isProductionBranch}`,
);

// Cloudflare production must never create a Preview. If the dashboard deploy
// command is accidentally set to "wrangler preview", fix it at runtime.
if (inWorkersCi && isProductionBranch && args[0] === "preview") {
  console.error(
    'wrangler-ci: production branch "main" received "wrangler preview"; using "wrangler deploy" instead',
  );
  args[0] = "deploy";
}

const hasConfig = args.some(
  (a) => a === "-c" || a === "--config" || a.startsWith("--config="),
);

const extra = [];
if (inWorkersCi && worker && CONFIG_BY_WORKER[worker] && !hasConfig) {
  const abs = path.join(repoRoot, CONFIG_BY_WORKER[worker]);
  const cwdConfigs = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"]
    .map((f) => path.join(process.cwd(), f))
    .filter((f) => fs.existsSync(f));
  const alreadyThatConfig = cwdConfigs.some(
    (f) => path.resolve(f) === path.resolve(abs),
  );
  if (fs.existsSync(abs) && !alreadyThatConfig) {
    extra.push("-c", abs);
    console.error(`wrangler-ci: ${worker} → ${abs}`);
  }
}

// The current Cloudflare Build settings have no build command. Build the site
// automatically before deploy/preview so ./dist always exists and is current.
const command = args[0];
const needsFrontendBuild =
  inWorkersCi &&
  !worker &&
  ["deploy", "preview"].includes(command);

if (needsFrontendBuild) {
  console.error("wrangler-ci: running npm run build before Cloudflare deployment");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (build.error) {
    console.error("wrangler-ci: build failed to start", build.error);
    process.exit(1);
  }
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

const child = spawn(process.execPath, [wranglerCli, ...extra, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
