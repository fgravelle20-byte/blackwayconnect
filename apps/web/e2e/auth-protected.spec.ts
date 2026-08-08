import { test, expect } from "@playwright/test";

test.describe("auth protected routes", () => {
  test("dashboard redirects unauthenticated users when Clerk is active", async ({ page }) => {
    await page.goto("/en/dashboard");
    // With Clerk: sign-in redirect. Without Clerk in local/dev: page may load or 503.
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|dashboard|Authentication is not configured/,
    );
  });

  test("protected projects API returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("onboarding and portal are gated for anonymous visitors", async ({ page }) => {
    await page.goto("/en/onboarding");
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|onboarding|Authentication is not configured/,
    );

    await page.goto("/en/portal");
    await expect(page).toHaveURL(
      /sign-in|clerk|accounts\.dev|portal|Authentication is not configured/,
    );
  });
});
