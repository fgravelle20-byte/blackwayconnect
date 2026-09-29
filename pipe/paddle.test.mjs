import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import pipe, { forfaitFromPaddleTransaction, forfaitFromProvisionPayload, signaturePaddleValide } from "./index.js";
import { decide, payerUrl } from "./engine.js";

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

test("the paid price wins over browser-controlled custom_data", () => {
  assert.equal(
    forfaitFromPaddleTransaction({
      custom_data: { bw_forfait: "grow_hub_partner" },
      items: [{ price: { id: "pri_01m3nt7s39b94k4p7a13m3sya2" } }],
    }),
    "cell_signal",
  );
  assert.equal(
    forfaitFromPaddleTransaction({ custom_data: { bw_forfait: "grow_hub_partner" }, items: [{ price: { id: "pri_vorixa" } }] }),
    null,
  );
});

test("maps every new Paddle price to its forfait", () => {
  const expected = {
    pri_01m3nt7rm1cc19134bb3e86fpb: "grow_hub_spark",
    pri_01m3nt7rs3vajzyv8k8r57qswc: "grow_hub_command",
    pri_01m3nt7rxx08w09zef4xf2rage: "grow_hub_partner",
    pri_01m3nt7s39b94k4p7a13m3sya2: "cell_signal",
    pri_01m3nt7s88bxrx8k6jph2gmtt2: "cell_route",
    pri_01m3nt7sd8mkr915y6vtgs6m3p: "cell_fleet",
    pri_01m3nt7sj4wndn0qkd9d855zpr: "cell_command",
    pri_01m3nt7sqgkcqb2payzrn0f8cf: "ia_chatbot_1",
    pri_01m3nt7ss5526fp4j6q98zdqc0: "ia_chatbot_5",
    pri_01m3nt7stvq4ff1942nybarhxn: "ia_chatbot_illimite",
    pri_01m3nt7szxc265whjs40e2y5pd: "ia_vocal_basic",
    pri_01m3nt7t1k43gy04eyf71amkd5: "ia_vocal_avance",
    pri_01m3nt7t39xq8pbggfeh6ejax4: "ia_vocal_premium",
  };
  for (const [id, forfait] of Object.entries(expected)) {
    assert.equal(forfaitFromPaddleTransaction({ items: [{ price: { id } }] }), forfait, id);
  }
});

test("rejects non-BlackWay Paddle prices", () => {
  assert.equal(
    forfaitFromPaddleTransaction({ items: [{ price: { id: "pri_vorixa" } }] }),
    null,
  );
});

test("provision relay payload resolves the paid forfait, never a silent default", () => {
  assert.equal(forfaitFromProvisionPayload({ forfait: "grow_hub_scale" }), "grow_hub_scale");
  assert.equal(forfaitFromProvisionPayload({ plan: "launch" }), "grow_hub_launch");
  assert.equal(forfaitFromProvisionPayload({ price_id: "pri_01kxtn6befjw8m8gz9a5vwf0wf" }), "grow_hub_scale");
  assert.equal(forfaitFromProvisionPayload({ custom_data: { bw_forfait: "grow_hub_launch" } }), "grow_hub_launch");
  assert.equal(
    forfaitFromProvisionPayload({ data: { items: [{ price: { id: "pri_01kxtn6asavavmqv54407h464b" } }] } }),
    "grow_hub_launch",
  );
  assert.equal(forfaitFromProvisionPayload({ items: [{ price_id: "pri_01kxtn6b41wzt07rnzvyte4sn8" }] }), "grow_hub_growth");
  assert.equal(forfaitFromProvisionPayload({ email: "a@b.c" }), null);
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

test("engine SLA breach moves inbox to leak with payer URL", () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  const out = decide(
    {
      stage: "inbox",
      source: "king_leads_page",
      created_at: "2026-09-29T09:00:00Z",
      sla_due: "2026-09-29T10:00:00Z",
      updated_at: "2026-09-29T09:00:00Z",
      intent: "grow_hub_growth",
      grade: "KING",
      score: 90,
      slaMinutes: 30,
      email: "ops@acme.ca",
      entreprise: "Acme",
      langue: "fr",
    },
    now,
  );
  assert.equal(out?.stage, "leak");
  assert.equal(out?.machine.next_action, "relance_sla");
  assert.equal(out?.machine.checkout, payerUrl("grow_hub_growth"));
  assert.match(out?.machine.script.html || "", /e10600/);
  assert.match(out?.machine.script.html || "", /Ouvrir le paiement Paddle/);
});

test("engine ignores HubSpot-era dumps and old form_web", () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  assert.equal(
    decide(
      {
        stage: "inbox",
        source: "form_web",
        created_at: "2026-08-01T00:00:00Z",
        sla_due: "2026-08-01T00:20:00Z",
        updated_at: "2026-08-01T00:00:00Z",
      },
      now,
    ),
    null,
  );
  assert.equal(decide({ stage: "inbox", source: "prospection", sla_due: "2000-01-01T00:00:00Z" }, now), null);
});

test("engine ignores won leads", () => {
  assert.equal(decide({ stage: "won", sla_due: "2000-01-01T00:00:00Z" }, Date.now()), null);
});

function mockHsContact(properties) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/crm/v3/objects/contacts/search")) {
      return new Response(JSON.stringify({ results: [{ id: "c1", properties }] }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };
  return () => {
    globalThis.fetch = previousFetch;
  };
}

async function claimByEmail(email) {
  return pipe.fetch(new Request("https://api.blackwayconnect.com/portal/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  }), { HUBSPOT_TOKEN: "pat-test", BW_PORTAL_SECRET: "portal-secret" }, { waitUntil() {} });
}

test("email claim refuses HubSpot customer with no paid Grow Hub", async () => {
  const restore = mockHsContact({
    email: "lead@example.com",
    lifecyclestage: "customer",
  });
  try {
    const response = await claimByEmail("lead@example.com");
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.match(String(body.erreur), /paiement Paddle/i);
  } finally {
    restore();
  }
});

test("email claim allows Grow Hub after Paddle even if HubSpot lifecycle is still lead", async () => {
  const restore = mockHsContact({
    email: "pay@example.com",
    lifecyclestage: "lead",
    bw_forfait_paye: "grow_hub_growth",
  });
  try {
    const response = await claimByEmail("pay@example.com");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.email, "pay@example.com");
    assert.equal(body.forfait, "grow_hub_growth");
    assert.ok(body.token);
  } finally {
    restore();
  }
});
