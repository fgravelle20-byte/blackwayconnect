import { chromium } from "playwright";

const TARGET_IP = "162.159.143.30";
const ZONE_URL =
  "https://dash.cloudflare.com/eda7fc96b400297aaa0b185a26ad1846/blackwayconnect.com/dns/records";

async function main() {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
  const context = browser.contexts()[0];
  if (!context) throw new Error("no context");
  let page = context.pages().find((p) => p.url().includes("cloudflare")) || context.pages()[0];
  if (!page) page = await context.newPage();

  console.log("page url:", page.url());
  if (!page.url().includes("dns/records")) {
    await page.goto(ZONE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  }
  await page.waitForTimeout(5000);

  // Dismiss modal
  const compris = page.getByRole("button", { name: "Compris" });
  if (await compris.isVisible().catch(() => false)) {
    await compris.click();
    await page.waitForTimeout(800);
  }

  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes(TARGET_IP)) {
    console.log("TARGET_ALREADY_GONE");
    // still try attach via checking absence
    process.exit(0);
  }

  // Click Modifier on the A record row with target IP
  // Prefer accessible name buttons
  const editButtons = page.getByRole("button", {
    name: /Modifier l’enregistrement A nommé blackwayconnect\.com/i,
  });
  const count = await editButtons.count();
  console.log("edit A buttons:", count);

  let clicked = false;
  for (let i = 0; i < count; i++) {
    const btn = editButtons.nth(i);
    // Expand nearby row - click and check if IP field shows target
    await btn.click();
    await page.waitForTimeout(1200);
    const visible = await page.locator("body").innerText();
    if (visible.includes(TARGET_IP) && (await page.getByRole("button", { name: "Supprimer" }).first().isVisible().catch(() => false))) {
      clicked = true;
      break;
    }
    // collapse by clicking Annuler if present
    const cancel = page.getByRole("button", { name: "Annuler" }).first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
    await page.waitForTimeout(500);
  }

  if (!clicked) {
    // Fallback: locate text IP then nearest Modifier
    const ipCell = page.getByText(TARGET_IP, { exact: true }).first();
    await ipCell.scrollIntoViewIfNeeded();
    const row = ipCell.locator("xpath=ancestor::*[self::tr or @role='row'][1]");
    const mod = row.getByRole("button", { name: /Modifier/i }).first();
    await mod.click();
    await page.waitForTimeout(1200);
  }

  const del = page.getByRole("button", { name: "Supprimer" }).first();
  await del.click({ timeout: 15000 });
  await page.waitForTimeout(1000);

  // Confirm in dialog
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: "Supprimer" }).click();
  } else {
    // nth confirm
    const buttons = page.getByRole("button", { name: "Supprimer" });
    const n = await buttons.count();
    await buttons.nth(Math.max(0, n - 1)).click();
  }

  await page.waitForTimeout(4000);
  const after = await page.locator("body").innerText();
  if (after.includes(TARGET_IP)) {
    console.log("STILL_PRESENT");
    await page.screenshot({ path: "C:/Users/suppo/AppData/Local/Temp/bw-dns-still.png", fullPage: true });
    process.exit(2);
  }
  console.log("DELETED_OK");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
