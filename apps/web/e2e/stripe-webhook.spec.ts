import { test, expect } from "@playwright/test";

test.describe("stripe webhook", () => {
  test("rejects missing or invalid stripe signature", async ({ request }) => {
    const invalidSig = await request.post("/api/webhooks/stripe", {
      data: JSON.stringify({ id: "evt_test", type: "ping" }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=invalid",
      },
    });
    expect(invalidSig.status()).toBeGreaterThanOrEqual(400);
    expect(invalidSig.ok()).toBeFalsy();

    const missingSig = await request.post("/api/webhooks/stripe", {
      data: "{}",
      headers: { "content-type": "application/json" },
    });
    expect(missingSig.status()).toBeGreaterThanOrEqual(400);
    expect(missingSig.ok()).toBeFalsy();
  });

  test("does not accept unsigned empty payload as success", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      data: "",
      headers: { "content-type": "application/json" },
    });
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(200);
  });
});
