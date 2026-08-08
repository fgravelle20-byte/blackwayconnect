import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("support ticket", () => {
  test("support API requires authentication", async ({ request }) => {
    const res = await request.post("/api/support", {
      data: { subject: "Help", body: "Need assistance with billing" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("authenticated user can create a ticket with message", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/dashboard/support");

    const subject = `E2E Support ${Date.now()}`;
    const message = "Need help verifying Phase 1 support tickets.";
    await page.getByPlaceholder(/Subject/i).fill(subject);
    await page.getByPlaceholder(/Message/i).fill(message);
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByText(subject)).toBeVisible({ timeout: 15_000 });

    const list = await page.request.get("/api/support");
    expect(list.ok()).toBeTruthy();
    const body = await list.json();
    const ticket = (body.tickets ?? []).find((t: { subject: string }) => t.subject === subject);
    expect(ticket).toBeTruthy();
    expect(ticket.status).toBe("open");
    const messages = ticket.support_messages ?? [];
    expect(messages.some((m: { body: string }) => m.body === message)).toBeTruthy();
  });
});
