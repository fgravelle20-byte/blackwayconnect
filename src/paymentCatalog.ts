/**
 * Wix Payments checkout configuration — replaces Paddle catalog.
 *
 * Set VITE_WIX_CHECKOUT_URLS as a JSON object mapping plan keys to Wix Payment Link URLs:
 *   {"grow_hub_growth":"https://www.wix.com/checkout/...","cell_signal":"https://..."}
 * Empty or missing = falls back to the contact page (no-op, no broken checkout).
 */
const WIX_CHECKOUT_URLS: Record<string, string> = (() => {
  try {
    return JSON.parse(String(import.meta.env.VITE_WIX_CHECKOUT_URLS || "{}"));
  } catch {
    return {};
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