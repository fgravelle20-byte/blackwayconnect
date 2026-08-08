import { test, expect } from "@playwright/test";
import { hasClerkTestCreds, signInWithTestUser } from "./fixtures/auth";

test.describe("projects CRUD", () => {
  test("projects API requires authentication", async ({ request }) => {
    expect((await request.get("/api/projects")).status()).toBe(401);
    expect(
      (
        await request.post("/api/projects", {
          data: { name: "Unauth project" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.patch("/api/projects/00000000-0000-0000-0000-000000000001", {
          data: { name: "Nope" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (await request.delete("/api/projects/00000000-0000-0000-0000-000000000001")).status(),
    ).toBe(401);
  });

  test("create list edit delete project when logged in", async ({ page }) => {
    test.skip(!hasClerkTestCreds(), "needs E2E_CLERK_TEST_USER_EMAIL/PASSWORD");

    await signInWithTestUser(page);
    await page.goto("/en/dashboard/projects");
    await expect(page.getByRole("heading", { name: /Projects/i })).toBeVisible({
      timeout: 20_000,
    });

    const name = `E2E Project ${Date.now()}`;
    await page.getByPlaceholder(/Project name/i).fill(name);
    await page.getByRole("button", { name: /Create project/i }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });

    const listRes = await page.request.get("/api/projects");
    expect(listRes.ok()).toBeTruthy();
    const listBody = await listRes.json();
    const project = (listBody.projects ?? []).find((p: { name: string }) => p.name === name);
    expect(project?.id).toBeTruthy();

    const renamed = `${name} edited`;
    const patchRes = await page.request.patch(`/api/projects/${project.id}`, {
      data: { name: renamed },
    });
    expect(patchRes.ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByText(renamed)).toBeVisible({ timeout: 15_000 });

    const row = page.getByRole("row").filter({ hasText: renamed });
    await row.getByRole("button", { name: /Delete/i }).click();
    await expect(page.getByText(renamed)).toHaveCount(0, { timeout: 15_000 });
  });
});
