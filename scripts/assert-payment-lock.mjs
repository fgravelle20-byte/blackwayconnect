#!/usr/bin/env node
/**
 * Hard gate: payment system must not drift from Wix Payments.
 * Exit 1 if LOCKED.json invariants are violated in source.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
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

function mustNotInclude(file, needle, label) {
  const text = read(file);
  if (text.includes(needle)) fail(`${label}: forbidden in ${file} → ${needle}`);
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

// Processor must be Wix (migrated from Paddle)
if (lock.processor !== "wix") fail('processor must be "wix"');
else console.log("OK processor=wix");

if (lock.billing_mode !== "immediate") fail('billing_mode must be "immediate"');
else console.log("OK billing_mode=immediate");

if (lock.legacy_stripe_outbound !== "disabled") fail('legacy_stripe_outbound must be "disabled"');
else console.log("OK legacy Stripe outbound disabled");

if (lock.legacy_stripe_webhook !== "history_only") fail('legacy_stripe_webhook must be "history_only"');
else console.log("OK legacy Stripe webhook history-only");

function runtimeFiles(rootRel) {
  const rootPath = join(root, rootRel);
  if (!existsSync(rootPath)) return [];
  const out = [];
  const walk = (abs, rel) => {
    for (const name of readdirSync(abs)) {
      const childAbs = join(abs, name);
      const childRel = join(rel, name);
      if (statSync(childAbs).isDirectory()) walk(childAbs, childRel);
      else if (/\.(?:ts|tsx|js|jsx|html)$/i.test(name)) out.push(childRel.replaceAll("\\", "/"));
    }
  };
  walk(rootPath, rootRel);
  return out;
}

// No Stripe checkout URLs in runtime files
for (const rel of [...runtimeFiles("src"), ...runtimeFiles("worker"), ...runtimeFiles("mobile/src"), "index.html"]) {
  if (!existsSync(join(root, rel))) continue;
  for (const forbidden of ["https://buy.stripe.com", "https://checkout.stripe.com"]) {
    mustNotInclude(rel, forbidden, `runtime cannot emit Stripe checkout host (${forbidden})`);
  }
}

// No Paddle.js or Paddle price IDs in source
for (const rel of runtimeFiles("src")) {
  mustNotInclude(rel, "cdn.paddle.com", `Paddle.js forbidden in ${rel}`);
}

// Payment catalog must exist and use Wix
mustInclude("src/paymentCatalog.ts", "VITE_WIX_CHECKOUT_URLS", "payment catalog uses Wix env var");
mustInclude("src/stripeConfig.ts", 'processor: "wix"', "checkout processor wix");
mustInclude("src/stripeConfig.ts", "paymentPlanUrl", "CHECKOUT_LINKS use paymentPlanUrl");

// Paddle catalog must be deprecated (re-export only, no live price IDs)
mustNotInclude("src/paddleCatalog.ts", "pri_01", "paddleCatalog has no Paddle price IDs");

// CheckoutPage must not contain Paddle token
mustNotInclude("src/pages/CheckoutPage.tsx", "live_a4f8ad8f1c8be908ec3784e8d8b", "CheckoutPage has no Paddle token");

// Cellulaire config must not have Paddle TODO
mustNotInclude("src/cellulaireConfig.ts", "PADDLE_CELLULAIRE_TODO", "Cellulaire UI has no Paddle backlog");

// paddleLoader must be a no-op (no Paddle.js)
mustNotInclude("src/paddleLoader.ts", "cdn.paddle.com", "paddleLoader has no Paddle.js");

// When locked, refuse unlock_ack leftovers (must be cleaned after intentional unlock merge).
if (lock.locked === true && lock.unlock_ack) {
  fail('locked=true but unlock_ack still present — remove unlock_ack to re-seal');
}

if (unlocking) {
  console.log("ATTENTION: unlock_ack present — intentional unlock mode (owner review required).");
}

if (process.exitCode) {
  console.error("\nRefusing to proceed: payment lock violated. See ops/payment-lock/README.md");
  process.exit(1);
}

console.log("\nPAYMENT LOCK OK — Wix Payments chain invariants intact.");