import { test, expect } from "@playwright/test";

const hasCreds = !!(process.env.E2E_CLERK_TEST_USER_EMAIL && process.env.E2E_CLERK_TEST_USER_PASSWORD);

test.describe("NoirRoutes marketing", () => {
  test("home redirects to /en", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en/);
  });

  test("en home shows brand", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("NoirRoutes").first()).toBeVisible();
  });

  test("fr home loads", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByText("NoirRoutes").first()).toBeVisible();
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
  });

  test("platform page loads", async ({ page }) => {
    await page.goto("/en/platform");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("request quote page loads", async ({ page }) => {
    await page.goto("/en/request-quote");
    await expect(page.getByRole("heading", { name: /quote/i })).toBeVisible();
  });

  test("legacy /pricing redirects to /en/pricing", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/en\/pricing/);
  });
});

test.describe("API", () => {
  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(String(body.service || body.name || "")).toMatch(/NoirRoutes/i);
  });

  test("catalog endpoint returns shape", async ({ request }) => {
    const res = await request.get("/api/commerce/catalog");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("plans");
  });
});

test.describe("Auth pages", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("body")).toBeVisible();
  });

  test("dashboard redirects unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Authenticated flows", () => {
  test.skip(!hasCreds, "Set E2E_CLERK_TEST_USER_EMAIL/PASSWORD for auth tests");

  test("login and reach dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[name="identifier"]', process.env.E2E_CLERK_TEST_USER_EMAIL!);
    await page.click('button:has-text("Continue")');
    await page.fill('input[name="password"]', process.env.E2E_CLERK_TEST_USER_PASSWORD!);
    await page.click('button:has-text("Continue")');
    await page.goto("/dashboard");
    await expect(page.getByText(/overview|dashboard/i).first()).toBeVisible();
  });

  test("projects page accessible when logged in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[name="identifier"]', process.env.E2E_CLERK_TEST_USER_EMAIL!);
    await page.click('button:has-text("Continue")');
    await page.fill('input[name="password"]', process.env.E2E_CLERK_TEST_USER_PASSWORD!);
    await page.click('button:has-text("Continue")');
    await page.goto("/dashboard/projects");
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
  });
});

test.describe("Legal pages", () => {
  test("terms page", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("privacy page", async ({ page }) => {
    await page.goto("/en/privacy");
    await expect(page.locator("h1")).toBeVisible();
  });
});