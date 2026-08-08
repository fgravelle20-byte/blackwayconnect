import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("quote creation", () => {
  test("quotes API requires authentication", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: { title: "Test quote", total_cents: 1000 },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("authenticated user can create a quote", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/dashboard/quotes");

    const title = `E2E Quote ${Date.now()}`;
    await page.getByPlaceholder(/Quote title/i).fill(title);
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    const list = await page.request.get("/api/quotes");
    expect(list.ok()).toBeTruthy();
    const body = await list.json();
    expect((body.quotes ?? []).some((q: { title: string }) => q.title === title)).toBeTruthy();
  });
});
