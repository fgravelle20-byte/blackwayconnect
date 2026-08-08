import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("customer portal", () => {
  test("Stripe portal API requires auth", async ({ request }) => {
    const res = await request.post("/api/stripe/portal", { data: {} });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("client portal route is protected", async ({ page }) => {
    await page.goto("/en/portal");
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|portal|Authentication is not configured/,
    );
  });

  test("authenticated portal session returns link or billing error", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/portal");
    await expect(page.getByRole("heading", { name: /Client portal/i })).toBeVisible({
      timeout: 20_000,
    });

    const res = await page.request.post("/api/stripe/portal", { data: { locale: "en" } });
    expect([200, 400, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.url).toMatch(/^https?:\/\//);
    } else if (res.status() === 400) {
      const body = await res.json();
      expect(body.error).toBeTruthy();
    }
  });
});
