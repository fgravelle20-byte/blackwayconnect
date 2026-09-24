/** Read-only checks for the public journey (blackwayconnect.com). */
const site = process.env.BW_SITE_URL || "https://blackwayconnect.com";
const pipe = process.env.BW_PIPE_URL || "https://api.blackwayconnect.com";
const preview = process.env.BW_PREVIEW_URL || "";

const checks = [
  { base: site, path: "/", expected: 200, label: "Accueil" },
  { base: site, path: "/forfaits", expected: 200, label: "Forfaits" },
  { base: site, path: "/forfaits-growth", expected: 200, label: "Growth landing" },
  { base: site, path: "/payer?plan=grow_hub_growth", expected: 200, label: "Checkout Paddle" },
  { base: site, path: "/contact", expected: 200, label: "Contact" },
  { base: site, path: "/portail", expected: 200, label: "Portail client" },
  { base: site, path: "/diagnostic", expected: 200, label: "Twin Turbo diagnostic" },
  { base: site, path: "/api/config", expected: 200, label: "Configuration publique" },
  { base: site, path: "/api/lead", expected: 405, label: "Leads: GET refusé" },
  { base: site, path: "/api/health", expected: 200, label: "Site health" },
  { base: pipe, path: "/health", expected: 200, label: "Pipe health" },
];
if (preview) {
  checks.push({
    base: preview,
    path: "/api/owner/overview",
    expected: 403,
    label: "Vue propriétaire: visiteur refusé",
  });
}

let failures = 0;
for (const check of checks) {
  try {
    const response = await fetch(new URL(check.path, check.base), {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    });
    const ok = response.status === check.expected;
    console.log(`${ok ? "OK" : "ÉCHEC"} ${check.label}: HTTP ${response.status}, attendu ${check.expected}`);
    if (!ok) failures++;
    if (ok && check.path === "/api/config") {
      const config = await response.json();
      const paddle =
        config.checkout?.processor === "paddle" &&
        ["grow_hub_launch", "grow_hub_growth", "grow_hub_scale"].every((plan) =>
          String(config.checkout?.[plan] || "").includes("/payer"),
        );
      console.log(`${paddle ? "OK" : "ÉCHEC"} Paiement : Launch/Growth/Scale → /payer (Paddle)`);
      if (!paddle) failures++;
    }
    if (ok && check.path === "/health" && check.base === pipe) {
      const health = await response.json();
      const paddleReady = health.paddle_ready === true || (health.paddle_api_key && health.paddle_webhook_secret);
      console.log(
        `${paddleReady ? "OK" : "ATTENTION"} Pipe paddle_ready=${health.paddle_ready} (api=${!!health.paddle_api_key}, wh=${!!health.paddle_webhook_secret})`,
      );
      // Soft fail — secrets may be Cloudflare-only; do not fail smoke on false alone.
    }
  } catch (error) {
    console.log(`ÉCHEC ${check.label}: ${error.name || "réseau"}`);
    failures++;
  }
}

console.log(
  "Funnel: home → /forfaits-growth → /payer?plan=… → /portail (claim) · Twin Turbo → /diagnostic",
);
if (failures) process.exitCode = 1;
