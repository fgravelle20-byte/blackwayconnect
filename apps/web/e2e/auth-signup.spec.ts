import { test, expect } from "@playwright/test";
import { hasClerkPublishableKey, hasClerkTestCreds } from "./fixtures/auth";

test.describe("auth signup", () => {
  test("sign-up page renders Clerk or config hint", async ({ page }) => {
    await page.goto("/en/sign-up");
    await expect(page.locator("body")).toBeVisible();

    if (!hasClerkPublishableKey()) {
      await expect(page.getByText(/Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/i)).toBeVisible();
      return;
    }

    await expect(
      page.locator('input[name="emailAddress"], input[name="identifier"]').first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("signup form accepts test email when credentials present", async ({ page }) => {
    test.skip(!hasClerkPublishableKey() || !hasClerkTestCreds(), "needs Clerk env + E2E test user");

    await page.goto("/en/sign-up");
    const emailInput = page
      .locator('input[name="emailAddress"], input[name="identifier"]')
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 30_000 });
    await emailInput.fill(process.env.E2E_CLERK_TEST_USER_EMAIL!);
    await expect(emailInput).toHaveValue(process.env.E2E_CLERK_TEST_USER_EMAIL!);
    await expect(page.getByRole("button", { name: /continue/i }).first()).toBeVisible();
  });
});
