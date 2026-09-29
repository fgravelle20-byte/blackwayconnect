import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import pipe from "./index.js";
import { runAutonomyTick, listMasterLeads, upsertMasterLead } from "./masterCrm.js";

/** Minimal D1 shim over node:sqlite (same SQL engine as D1). */
function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("./migrations/0001_master_king.sql", import.meta.url), "utf8"));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    first: async () => {
      const row = db.prepare(sql).get(...args);
      return row ? { ...row } : null;
    },
    all: async () => ({ results: db.prepare(sql).all(...args).map((r) => ({ ...r })) }),
  });
  return { prepare: (sql) => stmt(sql), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

function kv() {
  const m = new Map();
  return { put: async (k, v) => void m.set(k, v), get: async (k, t) => { const v = m.get(k); return v == null ? null : t === "json" ? JSON.parse(v) : v; }, _m: m };
}

globalThis.caches = { default: { put: async () => {}, match: async () => null } };

function envNoHubspot() {
  return { BW_DB: d1(), BW_SESSIONS: kv(), BW_PORTAL_SECRET: "s", BW_PADDLE_FULFILL_KEY: "k", BW_LEAD_KEY: "lk" };
}

const call = (env, path, body, headers = {}) =>
  pipe.fetch(
    new Request(`https://api.blackwayconnect.com${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    { waitUntil() {} },
  );

test("paid customer gets portal access with no HubSpot at all", async () => {
  const hubspotCalls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u) => { hubspotCalls.push(String(u.url || u)); return new Response("{}", { status: 500 }); };
  try {
    const env = envNoHubspot();
    let r = await call(env, "/portal/provision", { email: "Owner@Acme.ca", price_id: "pri_01kxtn6befjw8m8gz9a5vwf0wf", payment_id: "txn_a1", entreprise: "Acme" }, { "X-BW-Fulfill-Key": "k" });
    let j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    assert.equal(j.provision.statut, "cree");
    assert.equal(j.provision.master_db, true);
    assert.equal(j.portal.forfait, "grow_hub_scale");

    r = await call(env, "/portal/provision", { email: "owner@acme.ca", forfait: "grow_hub_scale", payment_id: "txn_a1" }, { "X-BW-Fulfill-Key": "k" });
    j = await r.json();
    assert.equal(j.provision.statut, "deja traite - aucun doublon");

    r = await call(env, "/portal/claim", { email: "OWNER@acme.ca" });
    j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    assert.equal(j.forfait, "grow_hub_scale");

    env.BW_SESSIONS = kv();
    r = await call(env, "/portal/claim", { transaction_id: "txn_a1" });
    j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    assert.equal(j.email, "owner@acme.ca");

    r = await call(env, "/portal/claim", { email: "stranger@nowhere.ca" });
    assert.equal(r.status, 401);

    const won = (await listMasterLeads(env, { stage: "won" })).leads;
    assert.equal(won.length, 1);
    assert.equal(won[0].email, "owner@acme.ca");
    assert.equal(hubspotCalls.filter((u) => u.includes("hubapi.com")).length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("engine tick never overwrites a lead created while it runs", async () => {
  const env = envNoHubspot();
  const king = { market: "qc", marketLabel: "Québec", score: 80, grade: "KING", slaMinutes: 15, urgence: "elevee", icp: "oui", reasons: [], briefing: "" };
  await upsertMasterLead(env, { email: "old@lead.ca", entreprise: "Old", source: "form_web" }, king);
  const realPrepare = env.BW_DB.prepare;
  let injected = false;
  env.BW_DB.prepare = (sql) => {
    if (!injected && sql.startsWith("UPDATE leads")) {
      injected = true;
      return { bind: (...a) => ({ run: async () => {
        await upsertMasterLead(env, { email: "new@lead.ca", entreprise: "New", source: "form_web" }, king);
        return realPrepare(sql).bind(...a).run();
      } }) };
    }
    return realPrepare(sql);
  };
  const summary = await runAutonomyTick(env, Date.now() + 3600000);
  assert.equal(summary.acted, 1);
  env.BW_DB.prepare = realPrepare;
  const emails = (await listMasterLeads(env)).leads.map((l) => l.email).sort();
  assert.deepEqual(emails, ["new@lead.ca", "old@lead.ca"]);
});

test("legacy KV board is migrated into D1 once", async () => {
  const env = envNoHubspot();
  env.BW_WORKSPACES = kv();
  await env.BW_WORKSPACES.put("crm:master:v1", JSON.stringify({ leads: [
    { id: "l1", email: "a@x.ca", entreprise: "A", stage: "qualified", score: 70, grade: "SURGICAL", created_at: "2026-01-01" },
    { id: "l2", email: "b@x.ca", entreprise: "", stage: "inbox", created_at: "2026-01-02" },
  ] }));
  const first = await listMasterLeads(env);
  assert.equal(first.storage, "d1");
  assert.equal(first.counts.total, 2);
  assert.equal(first.counts.qualified, 1);
  const again = await listMasterLeads(env);
  assert.equal(again.counts.total, 2);
});

test("health is ok on the Master DB without HubSpot", async () => {
  const r = await call(envNoHubspot(), "/health");
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.master_db, true);
  assert.equal(j.brain, "blackway_master_king");
  assert.equal(j.hubspot_sync, false);
});

test("owner overview reads the Master DB", async () => {
  const env = envNoHubspot();
  await call(env, "/portal/provision", { email: "pay@acme.ca", forfait: "grow_hub_launch", payment_id: "txn_o1" }, { "X-BW-Fulfill-Key": "k" });
  const r = await call(env, "/ops/overview", null, { "X-BW-Key": "lk" });
  const j = await r.json();
  assert.equal(r.status, 200, JSON.stringify(j));
  assert.ok(j.deals.some((d) => d.id === "txn_o1" && d.dealstage === "3584700395"));
  assert.ok(j.contacts.some((c) => c.email === "pay@acme.ca" && c.lifecyclestage === "customer"));
});
