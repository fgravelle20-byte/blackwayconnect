/** Read-only checks for the public journey and private owner boundary. */
const site = process.env.BW_SITE_URL || "https://blackwayconnect.com";
const preview = process.env.BW_PREVIEW_URL || "";
const checks = [
  { base: site, path: "/", expected: 200, label: "Accueil" },
  { base: site, path: "/forfaits", expected: 200, label: "Forfaits" },
  { base: site, path: "/contact", expected: 200, label: "Contact" },
  { base: site, path: "/portail", expected: 200, label: "Portail client" },
  { base: site, path: "/api/config", expected: 200, label: "Configuration publique" },
  { base: site, path: "/api/lead", expected: 405, label: "Leads: GET refusé" },
];
if (preview) checks.push({ base: preview, path: "/api/owner/overview", expected: 403, label: "Vue propriétaire: visiteur refusé" });

let failures = 0;
for (const check of checks) {
  try {
    const response = await fetch(new URL(check.path, check.base), { redirect: "manual", signal: AbortSignal.timeout(12000) });
    const ok = response.status === check.expected;
    console.log(`${ok ? "OK" : "ÉCHEC"} ${check.label}: HTTP ${response.status}, attendu ${check.expected}`);
    if (!ok) failures++;
    if (ok && check.path === "/api/config") {
      const config = await response.json();
      const paddle = config.checkout?.processor === "paddle" &&
        ["grow_hub_launch", "grow_hub_growth", "grow_hub_scale"].every((plan) =>
          new URL(config.checkout?.[plan]).pathname.endsWith("/payer"));
      console.log(`${paddle ? "OK" : "ÉCHEC"} Paiement : les trois forfaits actifs utilisent Paddle`);
      if (!paddle) failures++;
    }
  } catch (error) {
    console.log(`ÉCHEC ${check.label}: ${error.name || "réseau"}`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
