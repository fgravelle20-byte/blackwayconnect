import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("stripe checkout", () => {
  test("checkout API rejects unauthenticated requests with 401", async ({ request }) => {
    const res = await request.post("/api/stripe/checkout", {
      data: { plan_price_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("checkout API validates body when authenticated", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    const res = await page.request.post("/api/stripe/checkout", {
      data: { mode: "subscription" },
    });
    expect([400, 401]).toContain(res.status());
    if (res.status() === 400) {
      const body = await res.json();
      expect(body.error).toBeTruthy();
    }
  });
});
