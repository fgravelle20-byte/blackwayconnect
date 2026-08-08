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

/** Walk through onboarding wizard if we landed there after auth. */
export async function completeOnboardingIfNeeded(page: Page) {
  if (!page.url().includes("/onboarding")) return;

  const continueBtn = page.getByRole("button", { name: /continue/i });
  const finishBtn = page.getByRole("button", { name: /finish|complete|done/i });

  // Welcome
  if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click();
  }

  const orgInput = page.locator("#onboarding-org-name");
  if (await orgInput.isVisible().catch(() => false)) {
    await orgInput.fill(`E2E Org ${Date.now()}`);
    await page.locator("#onboarding-industry").fill("Testing");
    await continueBtn.click();
  }

  // Advance through optional plan-specific steps until goals / finish
  for (let i = 0; i < 8; i++) {
    if (page.url().includes("/dashboard")) return;

    const goals = page.locator("#onboarding-goals, #onboarding-goals-final");
    if (await goals.first().isVisible().catch(() => false)) {
      await goals.first().fill("Ship Phase 1 E2E coverage");
    }

    if (await finishBtn.isVisible().catch(() => false)) {
      await finishBtn.click();
      await page.waitForURL(/\/(en\/)?dashboard/, { timeout: 45_000 });
      return;
    }

    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(400);
      continue;
    }
    break;
  }
}

/** Sign in via Clerk embedded form and land on dashboard (completing onboarding if needed). */
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
  await completeOnboardingIfNeeded(page);
}

export async function expectSignedInDashboard(page: Page) {
  if (!page.url().includes("/dashboard")) {
    await page.goto("/en/dashboard");
    await completeOnboardingIfNeeded(page);
  }
  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.getByText(/overview|dashboard|BLACKWAYCONNECT/i).first()).toBeVisible({
    timeout: 20_000,
  });
}
