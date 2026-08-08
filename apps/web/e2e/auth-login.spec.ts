import { test, expect } from "@playwright/test";
import {
  expectSignedInDashboard,
  hasClerkPublishableKey,
  hasClerkTestCreds,
  signInWithTestUser,
} from "./fixtures/auth";

test.describe("auth login", () => {
  test("sign-in page renders Clerk or config hint", async ({ page }) => {
    await page.goto("/en/sign-in");
    await expect(page.locator("body")).toBeVisible();

    if (!hasClerkPublishableKey()) {
      await expect(page.getByText(/Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/i)).toBeVisible();
      return;
    }

    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 30_000 });
  });

  test("login with test user redirects to dashboard", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await expectSignedInDashboard(page);
  });
});
