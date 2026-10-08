/**
 * Wix Payments checkout configuration — replaces Paddle catalog.
 *
 * Set VITE_WIX_CHECKOUT_URLS as a JSON object mapping plan keys to Wix Payment Link URLs:
 *   {"grow_hub_growth":"https://www.wix.com/checkout/...","cell_signal":"https://..."}
 * Empty or missing = falls back to the contact page (no-op, no broken checkout).
 */
/**
 * Wix Pricing Plans checkout pages (site "Vorixa Growth and Automate", plans "BlackWay — …",
 * monthly, CAD, created 2026-10-08). Each URL opens the Wix checkout for one plan.
 * VITE_WIX_CHECKOUT_URLS still overrides any entry if set at build time.
 */
const DEFAULT_WIX_CHECKOUT_URLS: Record<string, string> = {
  grow_hub_spark: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIxZmE2ZWU1MS02MDVhLTQ0M2UtYjE2Ni00ZTc3OWU4YzkwZmIifQ==",
  grow_hub_launch: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIyZGJlNjY5Yy1jZDJiLTQyMzMtOWQ3OS03ZDNkMmZhM2Q2YTMifQ==",
  grow_hub_growth: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiI3NTc2OTZlNy05M2IzLTQyMDgtYjBkMS0xN2RiOTIwMjE1Y2IifQ==",
  grow_hub_scale: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiI3YTQwNjg4My1iNjliLTQyMGQtYjgzNS05ZDk0ZTM5OWM4M2YifQ==",
  grow_hub_command: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIyZjY4YTk4ZC1mZDAwLTQ3ZDItYWIzNS1mNDg2YjZjYzZhZjIifQ==",
  grow_hub_partner: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJlYzEwMTc5OC1iYjNmLTQ0MTYtYTFjYS01YmE3MTM3YTY1NmEifQ==",
  cell_signal: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJiZmZiNDRkMC01MDk4LTQ5ZmMtOWYwMC05NjRiZmUxNjg4YjQifQ==",
  cell_route: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJiYTczYTA3Mi01MmNlLTRmM2ItYmRmYi00ZDk0MjY1Njg4YjUifQ==",
  cell_fleet: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIyNjY2NGZjNS0yOTM3LTQwN2MtOTY1Ni0yODRiOTQxMzE4NzIifQ==",
  cell_command: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIzYTU5OWJlMC1jMjZhLTQzNDktYmRhOC0wYTEyMjU2MDY5Y2QifQ==",
  ia_chatbot_1: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJjODhlYWY2Yi1kZDhkLTQ4NzYtYTVkZS02Y2E3MTUzNTgzZWMifQ==",
  ia_chatbot_5: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiI2OTFjOGU5OS0xYzI4LTRkZWEtYmU5OC0wOTc0OTQ5ZDA4NTQifQ==",
  ia_chatbot_illimite: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJjZDZlOTI4ZC0zYTQ5LTRhYTEtYTY1OC03NzUyMjFlOTg3MWEifQ==",
  ia_vocal_basic: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIxNTc2MGI4YS0wYzE1LTRmYWYtOGU1MC1lZWYwMDIwMmMxOWEifQ==",
  ia_vocal_avance: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiIyZDRiNjAzNy0wZGVmLTQ0YWQtOWJmYy1mYTlmMTE5YzE0ZWMifQ==",
  ia_vocal_premium: "https://infoserviceclient.wixsite.com/my-site-1/pricing-plans/payment/eyJwbGFuSWQiOiJjNTJhYmRkMC1kYTk2LTRiODMtYTc0Zi03YmEyNjUzM2NmN2UifQ==",
};

const WIX_CHECKOUT_URLS: Record<string, string> = (() => {
  try {
    return { ...DEFAULT_WIX_CHECKOUT_URLS, ...JSON.parse(String(import.meta.env.VITE_WIX_CHECKOUT_URLS || "{}")) };
  } catch {
    return { ...DEFAULT_WIX_CHECKOUT_URLS };
  }
})();

export type PaymentPlanKey =
  | "grow_hub_spark"
  | "grow_hub_launch"
  | "grow_hub_growth"
  | "grow_hub_scale"
  | "grow_hub_command"
  | "grow_hub_partner"
  | "cell_signal"
  | "cell_route"
  | "cell_fleet"
  | "cell_command"
  | "ia_chatbot_1"
  | "ia_chatbot_5"
  | "ia_chatbot_illimite"
  | "ia_vocal_basic"
  | "ia_vocal_avance"
  | "ia_vocal_premium";

/** All known plan keys (used for type safety even when URLs aren't configured yet). */
export const ALL_PLAN_KEYS: PaymentPlanKey[] = [
  "grow_hub_spark", "grow_hub_launch", "grow_hub_growth",
  "grow_hub_scale", "grow_hub_command", "grow_hub_partner",
  "cell_signal", "cell_route", "cell_fleet", "cell_command",
  "ia_chatbot_1", "ia_chatbot_5", "ia_chatbot_illimite",
  "ia_vocal_basic", "ia_vocal_avance", "ia_vocal_premium",
];

export function isPaymentPlanKey(value: string): value is PaymentPlanKey {
  return (ALL_PLAN_KEYS as string[]).includes(value);
}

/** Returns true when a Wix checkout URL is configured for this plan. */
export function hasCheckoutUrl(plan: string): boolean {
  return !!WIX_CHECKOUT_URLS[plan];
}

/**
 * Build the checkout URL for a plan.
 * If a Wix Payment Link is configured, returns that URL (with UTM params appended).
 * Otherwise falls back to the contact page with the plan as a query param.
 */
export function paymentPlanUrl(
  plan: string,
  opts: { source?: string; lang?: "fr" | "en"; content?: string } = {},
): string {
  const base = WIX_CHECKOUT_URLS[plan];
  if (base) {
    const url = new URL(base);
    if (opts.source) url.searchParams.set("utm_source", opts.source);
    if (opts.content) url.searchParams.set("utm_content", opts.content);
    return url.toString();
  }
  // Fallback: contact page
  const url = new URL(
    opts.lang === "en" ? "/en/contact" : "/contact",
    "https://blackwayconnect.com",
  );
  url.searchParams.set("forfait", plan);
  if (opts.source) url.searchParams.set("bw_source", opts.source);
  if (opts.content) url.searchParams.set("utm_content", opts.content);
  return url.toString();
}