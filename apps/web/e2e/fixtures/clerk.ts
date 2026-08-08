import type { Page } from "@playwright/test";

export async function clerkSignIn(page: Page) {
  const email = process.env.E2E_CLERK_TEST_USER_EMAIL;
  const password = process.env.E2E_CLERK_TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_CLERK_TEST_USER_EMAIL/PASSWORD required");
  }
  await page.goto("/en/sign-in");
  await page.fill('input[name="identifier"]', email);
  await page.click('button:has-text("Continue")');
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Continue")');
  await page.waitForURL(/dashboard|onboarding|sign-in/, { timeout: 30_000 });
}

export function hasClerkE2ECreds() {
  return Boolean(
    process.env.E2E_CLERK_TEST_USER_EMAIL && process.env.E2E_CLERK_TEST_USER_PASSWORD,
  );
}
