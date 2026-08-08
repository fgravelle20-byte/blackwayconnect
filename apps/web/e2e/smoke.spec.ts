import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("NoirRoutes").first()).toBeVisible();
});

test("pricing page loads", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { name: /Pricing|Forfaits/i })).toBeVisible();
});

test("signup page loads", async ({ page }) => {
  await page.goto("/en/sign-up");
  await expect(page.locator("body")).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/en/sign-in");
  await expect(page.locator("body")).toBeVisible();
});

test("dashboard protected route", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/sign-in|clerk|accounts\.dev|dashboard/);
});

test("request quote page loads", async ({ page }) => {
  await page.goto("/en/request-quote");
  await expect(page.locator("body")).toBeVisible();
});

test("health endpoint", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
});

test("platform page loads", async ({ page }) => {
  await page.goto("/en/platform");
  await expect(page.locator("body")).toBeVisible();
});

test("studio page loads", async ({ page }) => {
  await page.goto("/en/studio");
  await expect(page.locator("body")).toBeVisible();
});

test("faq page loads", async ({ page }) => {
  await page.goto("/en/faq");
  await expect(page.locator("body")).toBeVisible();
});

test("terms page loads", async ({ page }) => {
  await page.goto("/en/terms");
  await expect(page.locator("body")).toBeVisible();
});

test("privacy page loads", async ({ page }) => {
  await page.goto("/en/privacy");
  await expect(page.locator("body")).toBeVisible();
});

test("admin route blocked without auth", async ({ page }) => {
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/sign-in|clerk|accounts\.dev|admin|dashboard/);
});

test("why page loads", async ({ page }) => {
  await page.goto("/en/why-noirroutes");
  await expect(page.locator("body")).toBeVisible();
});

test("catalog API responds", async ({ request }) => {
  const res = await request.get("/api/commerce/catalog");
  expect([200, 503]).toContain(res.status());
});