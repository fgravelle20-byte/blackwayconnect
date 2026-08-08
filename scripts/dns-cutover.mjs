/**
 * One-shot: delete apex A record 162.159.143.30 then print status.
 * Uses Edge persistent profile so Cloudflare login cookies apply.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "os";
import { join } from "path";

const ZONE_URL =
  "https://dash.cloudflare.com/eda7fc96b400297aaa0b185a26ad1846/blackwayconnect.com/dns/records";
const TARGET_IP = "162.159.143.30";
const edgeSrc = join(
  process.env.LOCALAPPDATA || "",
  "Microsoft",
  "Edge",
  "User Data",
);
const profileDir = join(process.env.TEMP || ".", "bw-cf-edge-profile");

async function main() {
  // Copy Default cookies/local storage lightly by reusing Edge channel + fresh profile
  // Prefer channel chrome/msedge with storage from existing login via CDP if available.
  let browser;
  try {
    browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
    console.log("connected existing CDP 9222");
  } catch {
    browser = null;
  }

  let context;
  let page;
  if (browser) {
    context = browser.contexts()[0] || (await browser.newContext());
    page = context.pages()[0] || (await context.newPage());
  } else {
    console.log("launching msedge channel");
    context = await chromium.launchPersistentContext(profileDir, {
      channel: "msedge",
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
      viewport: { width: 1400, height: 900 },
    });
    page = context.pages()[0] || (await context.newPage());
  }

  await page.goto(ZONE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(4000);

  // Dismiss welcome modal if present
  const compris = page.getByRole("button", { name: "Compris" });
  if (await compris.isVisible().catch(() => false)) {
    await compris.click();
    await page.waitForTimeout(1000);
  }

  // Find row containing target IP and open Modifier
  const row = page.locator(`tr:has-text("${TARGET_IP}"), [role="row"]:has-text("${TARGET_IP}")`).first();
  if (!(await row.count())) {
    // Maybe already deleted
    const body = await page.locator("body").innerText();
    if (!body.includes(TARGET_IP)) {
      console.log("TARGET_GONE");
      await context.close().catch(() => {});
      process.exit(0);
    }
    console.log("ROW_NOT_FOUND");
    await page.screenshot({ path: join(process.env.TEMP || ".", "bw-dns-fail.png"), fullPage: true });
    process.exit(2);
  }

  const editBtn = row.getByRole("button", { name: /Modifier/i }).first();
  await editBtn.click();
  await page.waitForTimeout(1500);

  const del = page.getByRole("button", { name: "Supprimer" }).first();
  await del.click();
  await page.waitForTimeout(1000);

  // Confirm modal
  const confirm = page.getByRole("button", { name: "Supprimer" }).nth(1);
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  } else {
    // try dialog
    await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  }

  await page.waitForTimeout(3000);
  const text = await page.locator("body").innerText();
  console.log(text.includes(TARGET_IP) ? "STILL_PRESENT" : "DELETED_OK");
  await page.screenshot({ path: join(process.env.TEMP || ".", "bw-dns-after.png"), fullPage: true });
  await context.close().catch(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
