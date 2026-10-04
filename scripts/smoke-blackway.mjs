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
  {
    base: site,
    path: "/checkout?plan=grow_hub_growth",
    expected: 308,
    label: "Legacy /checkout → Paddle Growth",
    redirectPath: "/payer",
    redirectPlan: "grow_hub_growth",
  },
  {
    base: site,
    path: "/stripe?payment_link=plink_1UCmC0AG7HUL9RtrSOaDDzbo",
    expected: 308,
    label: "Legacy Stripe plink → Paddle Scale",
    redirectPath: "/payer",
    redirectPlan: "grow_hub_scale",
  },
  {
    base: site,
    path: "/paiement-stripe?forfait=cell_fleet",
    expected: 308,
    label: "Legacy Stripe route → Paddle Cell Fleet",
    redirectPath: "/payer",
    redirectPlan: "cell_fleet",
  },
  {
    base: site,
    path: "/payer?provider=stripe&plan=ia_chatbot_1",
    expected: 308,
    label: "Stripe-marked /payer sanitized",
    redirectPath: "/payer",
    redirectPlan: "ia_chatbot_1",
  },
  {
    base: site,
    path: "/checkout",
    expected: 308,
    label: "Unknown legacy checkout → forfaits",
    redirectPath: "/forfaits",
  },
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
    let ok = response.status === check.expected;
    if (ok && check.redirectPath) {
      const location = response.headers.get("location") || "";
      try {
        const target = new URL(location, check.base);
        const pathOk = target.origin === new URL(site).origin && target.pathname === check.redirectPath;
        const planOk = check.redirectPlan ? target.searchParams.get("plan") === check.redirectPlan : true;
        const stripeHost = /(^|\.)stripe\.com$/i.test(target.hostname);
        ok = pathOk && planOk && !stripeHost;
        console.log(
          `${ok ? "OK" : "ÉCHEC"} ${check.label}: Location=${location || "(absente)"}`,
        );
      } catch {
        ok = false;
      }
    } else {
      console.log(`${ok ? "OK" : "ÉCHEC"} ${check.label}: HTTP ${response.status}, attendu ${check.expected}`);
    }
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
      const stripeClosed = health.legacy_stripe_checkout?.closed === true;
      console.log(
        `${stripeClosed ? "OK" : "ÉCHEC"} Legacy Stripe checkout closed=${!!health.legacy_stripe_checkout?.closed}`,
      );
      if (!stripeClosed) failures++;
      // Paddle secret readiness remains a soft signal; Stripe outbound closure is a hard invariant.
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
