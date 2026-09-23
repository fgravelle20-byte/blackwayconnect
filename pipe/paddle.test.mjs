import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { forfaitFromPaddleTransaction, signaturePaddleValide } from "./index.js";

test("maps the three existing Paddle BlackWay prices", () => {
  assert.equal(
    forfaitFromPaddleTransaction({ items: [{ price: { id: "pri_01kxtn6asavavmqv54407h464b" } }] }),
    "grow_hub_launch",
  );
  assert.equal(
    forfaitFromPaddleTransaction({ details: { line_items: [{ price: { id: "pri_01kxtn6b41wzt07rnzvyte4sn8" } }] } }),
    "grow_hub_growth",
  );
  assert.equal(
    forfaitFromPaddleTransaction({ custom_data: { bw_forfait: "grow_hub_scale" } }),
    "grow_hub_scale",
  );
});

test("rejects non-BlackWay Paddle prices", () => {
  assert.equal(
    forfaitFromPaddleTransaction({ items: [{ price: { id: "pri_vorixa" } }] }),
    null,
  );
});

test("verifies Paddle-Signature against the raw body", async () => {
  const secret = "pdl_ntfset_test_secret";
  const body = JSON.stringify({ event_type: "transaction.completed", data: { id: "txn_test" } });
  const ts = Math.floor(Date.now() / 1000);
  const h1 = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  assert.equal(await signaturePaddleValide(secret, body, `ts=${ts};h1=${h1}`), true);
  assert.equal(await signaturePaddleValide(secret, `${body} `, `ts=${ts};h1=${h1}`), false);
});
