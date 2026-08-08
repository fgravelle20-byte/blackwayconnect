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

  test("authenticated checkout with catalog plan_price_id reaches Stripe or config error", async ({
    page,
  }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    const catalogRes = await page.request.get("/api/commerce/catalog");
    test.skip(!catalogRes.ok(), "commerce catalog unavailable");

    const catalog = await catalogRes.json();
    const plan = (catalog.plans ?? []).find(
      (p: { is_public?: boolean; prices?: { id: string; is_active?: boolean }[] }) =>
        p.is_public && (p.prices ?? []).some((pr) => pr.is_active),
    );
    const price = plan?.prices?.find(
      (pr: { interval?: string; is_active?: boolean }) =>
        pr.is_active && pr.interval === "month",
    );
    test.skip(!price?.id, "no active monthly plan price in catalog");

    const res = await page.request.post("/api/stripe/checkout", {
      data: { mode: "subscription", plan_price_id: price.id, locale: "en" },
    });

    // 200 = Checkout Session URL (Stripe test mode configured)
    // 400 = org/stripe price issues
    // 503 = Stripe secret missing
    expect([200, 400, 503]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 200) {
      expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
      expect(body.id).toMatch(/^cs_/);
    } else {
      expect(body.error).toBeTruthy();
    }
  });
});
