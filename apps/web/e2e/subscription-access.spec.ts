import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("subscription access / module gating", () => {
  test("gated module pages require authentication", async ({ page, request }) => {
    expect((await request.get("/api/projects")).status()).toBe(401);

    await page.goto("/en/dashboard/business");
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|dashboard|Authentication is not configured/,
    );
  });

  test("logged-in user sees plan gate or later-phase shell on modules", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);

    await page.goto("/en/dashboard/business");
    await expect(page.getByRole("heading", { name: /Business/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/does not include this feature|later phase|Upgrade your plan|entitlements/i),
    ).toBeVisible();

    await page.goto("/en/dashboard/seo");
    await expect(page.getByRole("heading", { name: /SEO/i })).toBeVisible();
    await expect(
      page.getByText(/does not include this feature|later phase|Upgrade your plan|entitlements/i),
    ).toBeVisible();

    await page.goto("/en/dashboard/chatbots");
    await expect(page.getByRole("heading", { name: /Chatbots/i })).toBeVisible();
    await expect(
      page.getByText(/does not include this feature|later phase|Upgrade your plan|entitlements/i),
    ).toBeVisible();
  });
});
