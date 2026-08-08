import { test, expect } from "@playwright/test";

test.describe("marketing home", () => {
  test("landing loads with brand and key sections", async ({ page }) => {
    await page.goto("/en");

    await expect(page.getByRole("heading", { name: "NoirRoutes", level: 1 })).toBeVisible();
    await expect(page.getByText(/Create\. Automate\. Scale/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /View pricing|pricing|Forfaits/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Build with AI|Créer|Automate|Scale|platform/i }).first(),
    ).toBeVisible();
  });
});
