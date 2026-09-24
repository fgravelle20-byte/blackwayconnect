#!/usr/bin/env node
/**
 * Hard gate: live payment chain must not drift.
 * Exit 1 if LOCKED.json invariants are violated in source.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "ops/payment-lock/LOCKED.json");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`PAYMENT LOCK FAIL: ${msg}`);
  process.exitCode = 1;
}

function mustInclude(file, needle, label) {
  const text = read(file);
  if (!text.includes(needle)) fail(`${label}: missing in ${file} → ${needle}`);
  else console.log(`OK ${label}`);
}

function mustMatch(file, re, label) {
  const text = read(file);
  if (!re.test(text)) fail(`${label}: pattern not found in ${file}`);
  else console.log(`OK ${label}`);
}

if (!existsSync(lockPath)) {
  fail("ops/payment-lock/LOCKED.json missing");
  process.exit(1);
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const unlocking =
  lock.locked === false &&
  lock.unlock_ack === "I_UNDERSTAND_UNLOCKING_LIVE_PAYMENTS";

if (lock.locked !== true && !unlocking) {
  fail('LOCKED.json must have "locked": true (or unlock with unlock_ack)');
}

if (!Number.isInteger(lock.lock_version) || lock.lock_version < 1) {
  fail("lock_version must be a positive integer");
}

console.log(`Payment lock v${lock.lock_version} locked=${lock.locked} unlocking=${unlocking}`);

if (lock.processor !== "paddle") fail('processor must be "paddle"');
else console.log("OK processor=paddle");

for (const [plan, priceId] of Object.entries(lock.prices || {})) {
  mustInclude("src/paddleCatalog.ts", priceId, `catalog ${plan}`);
  mustInclude("pipe/index.js", priceId, `pipe map ${plan}`);
}

for (const [priceId, forfait] of Object.entries(lock.pipe_price_map || {})) {
  mustInclude("pipe/index.js", priceId, `pipe price ${priceId}`);
  mustInclude("pipe/index.js", `"${forfait}"`, `pipe forfait ${forfait}`);
}

mustInclude(
  "src/pages/CheckoutPage.tsx",
  lock.paddle_client_token_live_prefix,
  "CheckoutPage live token fallback",
);

mustInclude(
  "pipe/wrangler.jsonc",
  lock.bw_paddle_fulfill_key,
  "BW_PADDLE_FULFILL_KEY in wrangler vars",
);

mustInclude("src/stripeConfig.ts", 'processor: "paddle"', "checkout processor paddle");
mustInclude("src/paddleCatalog.ts", "/payer", "checkout links → /payer");
mustInclude("src/stripeConfig.ts", "paddlePlanUrl", "CHECKOUT_LINKS use paddlePlanUrl");

mustMatch(
  "pipe/index.js",
  /hsSource\s*=\s*cell\s*\|\|\s*processor\s*===\s*"paddle"\s*\?\s*"portail"\s*:\s*"stripe"/,
  "HubSpot bw_source maps paddle → portail",
);

// When locked, refuse unlock_ack leftovers (must be cleaned after intentional unlock merge).
if (lock.locked === true && lock.unlock_ack) {
  fail('locked=true but unlock_ack still present — remove unlock_ack to re-seal');
}

mustInclude("pipe/index.js", 'processor: "paddle"', "pipe paddle processor paths");
mustInclude("pipe/index.js", "/portal/provision", "portal provision route");
mustInclude("pipe/index.js", "X-BW-Fulfill-Key", "fulfill key header support");

if (lock.hubspot_bw_source_for_paddle !== "portail") {
  fail('hubspot_bw_source_for_paddle must be "portail"');
} else {
  console.log("OK hubspot bw_source for paddle = portail");
}

if (unlocking) {
  console.log("ATTENTION: unlock_ack present — intentional unlock mode (owner review required).");
}

if (process.exitCode) {
  console.error("\nRefusing to proceed: payment lock violated. See ops/payment-lock/README.md");
  process.exit(1);
}

console.log("\nPAYMENT LOCK OK — live Paddle chain invariants intact.");
