import { expect, type Page } from "@playwright/test";

export function hasClerkTestCreds(): boolean {
  return Boolean(
    process.env.E2E_CLERK_TEST_USER_EMAIL && process.env.E2E_CLERK_TEST_USER_PASSWORD,
  );
}

export function hasClerkPublishableKey(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && !key.includes("placeholder") && key.length > 20);
}

/** Sign in via Clerk embedded form and land on dashboard or onboarding. */
export async function signInWithTestUser(page: Page) {
  const email = process.env.E2E_CLERK_TEST_USER_EMAIL!;
  const password = process.env.E2E_CLERK_TEST_USER_PASSWORD!;

  await page.goto("/en/sign-in");
  await page.locator('input[name="identifier"]').waitFor({ state: "visible", timeout: 30_000 });
  await page.fill('input[name="identifier"]', email);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.locator('input[name="password"]').waitFor({ state: "visible", timeout: 15_000 });
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /continue|sign in/i }).click();
  await page.waitForURL(/\/(en\/)?(dashboard|onboarding)/, { timeout: 45_000 });
}

export async function expectSignedInDashboard(page: Page) {
  if (!page.url().includes("/dashboard")) {
    await page.goto("/en/dashboard");
  }
  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.getByText(/overview|dashboard|NoirRoutes/i).first()).toBeVisible({
    timeout: 20_000,
  });
}
