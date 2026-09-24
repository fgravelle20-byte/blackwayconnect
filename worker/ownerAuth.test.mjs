import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizeOwner } from "./ownerAuth.ts";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

test("owner access verifies signature, audience and exact owner email", async () => {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [{ ...jwk, kid: "owner-key" }] });
  const env = { CF_ACCESS_TEAM_DOMAIN: "blackway.cloudflareaccess.com", CF_ACCESS_AUD: "owner-audience", BW_OWNER_EMAIL: "francis@example.com" };
  const makeRequest = async (email, aud = "owner-audience") => {
    const header = encode({ alg: "RS256", kid: "owner-key" });
    const payload = encode({ iss: "https://blackway.cloudflareaccess.com", aud, email, exp: Math.floor(Date.now() / 1000) + 120 });
    const signed = `${header}.${payload}`;
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(signed));
    return new Request("https://blackwayconnect.com/api/owner/overview", { headers: { "Cf-Access-Jwt-Assertion": `${signed}.${Buffer.from(signature).toString("base64url")}` } });
  };
  try {
    assert.equal(await authorizeOwner(await makeRequest("francis@example.com"), env), true);
    assert.equal(await authorizeOwner(await makeRequest("another@example.com"), env), false);
    assert.equal(await authorizeOwner(await makeRequest("francis@example.com", "different-audience"), env), false);
    assert.equal(await authorizeOwner(new Request("https://blackwayconnect.com/api/owner/overview"), env), false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
