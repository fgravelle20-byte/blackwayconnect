import { chromium } from "playwright";

async function main() {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(
    "https://dash.cloudflare.com/eda7fc96b400297aaa0b185a26ad1846/blackwayconnect.com/dns/records",
    { waitUntil: "domcontentloaded", timeout: 120000 },
  );
  await page.waitForTimeout(5000);
  const compris = page.getByRole("button", { name: "Compris" });
  if (await compris.isVisible().catch(() => false)) await compris.click();
  const text = await page.locator("body").innerText();
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => /blackwayconnect|A\b|AAAA|CNAME|162\.|172\.|2606|workers/i.test(l));
  console.log(lines.slice(0, 80).join("\n"));
  // Also check workers custom domains page
  await page.goto(
    "https://dash.cloudflare.com/eda7fc96b400297aaa0b185a26ad1846/workers/services/view/blackway-site/production/settings",
    { waitUntil: "domcontentloaded", timeout: 120000 },
  );
  await page.waitForTimeout(4000);
  const t2 = await page.locator("body").innerText();
  console.log("--- SETTINGS ---");
  console.log(
    t2
      .split(/\n+/)
      .filter((l) => /domain|blackway|route|trigger|custom/i.test(l))
      .slice(0, 40)
      .join("\n"),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
