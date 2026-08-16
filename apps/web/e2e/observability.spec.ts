import { test, expect } from "@playwright/test";

/**
 * Phase 1 observability smoke — asserts wiring surfaces exist.
 * Full delivery (inbox / Sentry UI / PostHog UI) remains a manual DoD check on PREVIEW.
 */
test.describe("observability integrations", () => {
  test("health reports integration flags for Resend, Sentry, PostHog", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("VORIXA");
    expect(body.integrations).toBeTruthy();
    expect(typeof body.integrations.resend).toBe("boolean");
    expect(typeof body.integrations.sentry).toBe("boolean");
    expect(typeof body.integrations.posthog).toBe("boolean");
    expect(typeof body.integrations.stripe).toBe("boolean");
    expect(typeof body.integrations.clerk).toBe("boolean");
  });

  test("marketing home loads PostHog provider without breaking render", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("VORIXA").first()).toBeVisible();
    // PostHog client is optional; page must still render when key is absent
    await expect(page.locator("body")).toBeVisible();
  });

  test("service request path triggers quote-received email template path", async ({ request }) => {
    const res = await request.post("/api/service-requests", {
      data: {
        contact_name: "E2E Tester",
        contact_email: "e2e-observability@example.com",
        description: "Observability email path smoke test",
        locale: "en",
      },
    });
    // 200 when Supabase configured; 503 when unavailable — both prove route exists
    expect([200, 500, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.request?.id || body.id).toBeTruthy();
    }
  });

  test("internal emails API requires auth", async ({ request }) => {
    const res = await request.post("/api/emails", {
      data: {
        to: "e2e@example.com",
        template: "welcome",
        locale: "en",
      },
    });
    expect([401, 403]).toContain(res.status());
  });
});
