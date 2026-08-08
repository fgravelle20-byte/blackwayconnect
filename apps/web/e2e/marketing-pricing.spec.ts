import { test, expect } from "@playwright/test";

test.describe("marketing pricing", () => {
  test("pricing loads six sections and catalog from API", async ({ page }) => {
    const catalogPromise = page.waitForResponse(
      (r) => r.url().includes("/api/commerce/catalog") && r.request().method() === "GET",
      { timeout: 30_000 },
    );

    await page.goto("/en/pricing");
    await expect(
      page.getByRole("heading", { name: /Pricing that scales with you/i }),
    ).toBeVisible();

    const catalog = await catalogPromise;
    expect([200, 503]).toContain(catalog.status());

    if (catalog.ok()) {
      const body = await catalog.json();
      expect(body).toHaveProperty("plans");
      expect(Array.isArray(body.plans)).toBeTruthy();
      await expect(
        page.getByRole("heading", { name: /Use the platform yourself/i }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("heading", { name: /Let BLACKWAYCONNECT build it for you/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Launch faster with a package/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Scale with automation/i }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /For agencies/i })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Enterprise \/ custom/i }),
      ).toBeVisible();
    } else {
      // Catalog unavailable locally / CI without Supabase — empty state still renders.
      await expect(page.getByText(/No plans available|Loading catalog/i)).toBeVisible();
    }
  });

  test("catalog API returns commerce shape", async ({ request }) => {
    const res = await request.get("/api/commerce/catalog");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("plans");
    expect(body).toHaveProperty("add_ons");
    expect(body).toHaveProperty("service_offers");
  });
});
