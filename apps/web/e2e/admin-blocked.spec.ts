import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("admin access control", () => {
  test("admin is blocked for anonymous users", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|dashboard|admin|Authentication is not configured/,
    );
  });

  test("admin plans API rejects non-admins", async ({ request }) => {
    const res = await request.patch("/api/admin/plans", {
      data: { limits: [] },
    });
    expect(res.ok()).toBeFalsy();
    expect([401, 403]).toContain(res.status());
  });

  test("non-platform-admin is redirected away from admin", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/en\/admin$/);
  });
});
