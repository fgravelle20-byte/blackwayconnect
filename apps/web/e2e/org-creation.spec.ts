import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("organization creation", () => {
  test("onboarding API rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/onboarding", {
      data: {
        org_name: "E2E Org",
        industry: "SaaS",
        goals: "Ship Phase 1",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("authenticated user can complete workspace onboarding", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/onboarding");

    await expect(page.getByRole("heading", { name: /Welcome to BLACKWAYCONNECT/i })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByLabel(/Organization name/i).fill(`E2E Workspace ${Date.now()}`);
    await page.getByLabel(/Industry/i).fill("Software");
    await page.getByRole("button", { name: /Continue|Next/i }).click();
    await page.getByLabel(/Primary goals/i).fill("Automate growth with BLACKWAYCONNECT");
    await page.getByRole("button", { name: /Finish setup|Continue|Next/i }).click();

    await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 45_000 });
  });
});
