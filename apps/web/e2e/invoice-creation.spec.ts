import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("business invoice creation", () => {
  test("business invoices API requires authentication", async ({ request }) => {
    expect((await request.get("/api/business-invoices")).status()).toBe(401);

    const create = await request.post("/api/business-invoices", {
      data: {
        total_cents: 5000,
        items: [{ description: "Studio deposit", amount_cents: 5000 }],
      },
    });
    expect(create.status()).toBe(401);
    const body = await create.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("authenticated user can create a business invoice", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);

    const res = await page.request.post("/api/business-invoices", {
      data: {
        total_cents: 12_500,
        items: [
          { description: `E2E line ${Date.now()}`, amount_cents: 10_000 },
          { description: "Tax / fees", amount_cents: 2_500 },
        ],
      },
    });

    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      expect(body.invoice?.id).toBeTruthy();
      expect(body.invoice.status).toBe("draft");
      expect(body.invoice.total_cents).toBe(12_500);

      const list = await page.request.get("/api/business-invoices");
      expect(list.ok()).toBeTruthy();
      const listed = await list.json();
      expect(
        (listed.invoices ?? []).some((inv: { id: string }) => inv.id === body.invoice.id),
      ).toBeTruthy();
    } else {
      const body = await res.json();
      expect(body.error).toMatch(/organization/i);
    }
  });
});
