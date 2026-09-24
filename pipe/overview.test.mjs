import { test } from "node:test";
import assert from "node:assert/strict";
import pipe from "./index.js";

test("owner overview requires a private key", async () => {
  const request = new Request("https://api.blackwayconnect.com/ops/overview");
  const response = await pipe.fetch(request, { BW_LEAD_KEY: "private-key" });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("owner overview reads only the BlackWay pipeline and associated contacts", async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: options?.body ? JSON.parse(options.body) : null });
    if (String(url).endsWith("/deals/search")) return Response.json({ results: [{ id: "123", properties: { pipeline: "2117849055", dealname: "BlackWay lead" } }] });
    if (String(url).endsWith("/associations/deals/contacts/batch/read")) return Response.json({ results: [{ from: { id: "123" }, to: [{ toObjectId: 456 }] }] });
    if (String(url).endsWith("/contacts/batch/read")) return Response.json({ results: [{ id: "456", properties: { email: "client@example.com" } }] });
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const request = new Request("https://api.blackwayconnect.com/ops/overview", { headers: { "X-BW-Key": "private-key" } });
    const response = await pipe.fetch(request, { BW_LEAD_KEY: "private-key", HUBSPOT_TOKEN: "test-token" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.deals.length, 1);
    assert.equal(body.contacts[0].email, "client@example.com");
    assert.equal(calls[0].body.filterGroups[0].filters[0].value, "2117849055");
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
