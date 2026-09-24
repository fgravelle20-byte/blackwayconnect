import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import pipe, { forfaitFromPaddleTransaction, signaturePaddleValide } from "./index.js";

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

test("portal provision accepts X-BW-Fulfill-Key when BW_LEAD_KEY differs", async () => {
  const previousFetch = globalThis.fetch;
  const hubspotBodies = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/crm/v3/properties/contacts/bw_last_checkout_session")) {
      return new Response(JSON.stringify({}), { status: 200 });
    }
    if (url.includes("/crm/v3/objects/contacts/search")) {
      return new Response(JSON.stringify({ results: [{ id: "c1", properties: { email: "pay@example.com", lifecyclestage: "customer", bw_forfait_paye: "grow_hub_growth" } }] }), { status: 200 });
    }
    if (url.includes("/crm/v3/objects/contacts")) {
      if (init?.body) hubspotBodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: "c1" }), { status: 200 });
    }
    if (url.includes("/crm/v3/objects/deals")) {
      if (init?.body) hubspotBodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: "d1" }), { status: 201 });
    }
    if (url.includes("/crm/v3/objects/notes")) {
      return new Response(JSON.stringify({ id: "n1" }), { status: 201 });
    }
    return new Response("{}", { status: 200 });
  };
  try {
    const denied = await pipe.fetch(new Request("https://api.blackwayconnect.com/portal/provision", {
      method: "POST",
      headers: { "content-type": "application/json", "X-BW-Fulfill-Key": "wrong" },
      body: JSON.stringify({ email: "pay@example.com", forfait: "grow_hub_growth", payment_id: "txn_test_fulfill" }),
    }), { BW_LEAD_KEY: "lead-secret", BW_PADDLE_FULFILL_KEY: "fulfill-secret", BW_PORTAL_SECRET: "portal", HUBSPOT_TOKEN: "pat-test" }, { waitUntil() {} });
    assert.equal(denied.status, 401);

    const ok = await pipe.fetch(new Request("https://api.blackwayconnect.com/portal/provision", {
      method: "POST",
      headers: { "content-type": "application/json", "X-BW-Fulfill-Key": "fulfill-secret" },
      body: JSON.stringify({ email: "pay@example.com", forfait: "grow_hub_growth", payment_id: "txn_test_fulfill", processor: "paddle" }),
    }), { BW_LEAD_KEY: "lead-secret", BW_PADDLE_FULFILL_KEY: "fulfill-secret", BW_PORTAL_SECRET: "portal", HUBSPOT_TOKEN: "pat-test" }, { waitUntil() {} });
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.ok, true);
    // HubSpot enum rejects "paddle" — map to portail while note still says Paddle.
    const sources = hubspotBodies.map((b) => b?.properties?.bw_source).filter(Boolean);
    assert.ok(sources.length >= 1);
    assert.ok(sources.every((s) => s === "portail"));
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("asks Paddle to retry when customer lookup fails after a valid payment", async () => {
  const secret = "pdl_ntfset_test_secret";
  const body = JSON.stringify({
    event_type: "transaction.completed",
    data: {
      id: "txn_test_payment",
      customer_id: "ctm_test_customer",
      items: [{ price: { id: "pri_01kxtn6b41wzt07rnzvyte4sn8" } }],
    },
  });
  const ts = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  try {
    const response = await pipe.fetch(new Request("https://api.blackwayconnect.com/webhooks/paddle", {
      method: "POST",
      headers: { "Paddle-Signature": `ts=${ts};h1=${signature}` },
      body,
    }), { PADDLE_WEBHOOK_SECRET: secret, PADDLE_API_KEY: "test-key" }, { waitUntil() {} });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).recu, undefined);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
