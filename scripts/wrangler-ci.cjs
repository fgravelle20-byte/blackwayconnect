#!/usr/bin/env node
/**
 * Cloudflare Workers Builds runs `npx wrangler versions upload` from the
 * connected Worker's root. This repo is a monorepo whose default wrangler.jsonc
 * is blackway-site. When CI sets WRANGLER_CI_OVERRIDE_NAME to blackway-pipe or
 * blackway-sentinel, point Wrangler at that Worker's config.
 */
"use strict";

const { spawn } = require("node:child_process");
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
