/** Existing Paddle Live prices for BlackWayConnect.
 * Prices are in CAD per month, with a 14-day trial. Never treat a client-side success
 * redirect as proof of payment; fulfillment must come from a verified webhook.
 *
 * PAYMENT-LOCKED — do not edit. See ops/payment-lock/LOCKED.json + README.md.
 * CI fails PRs that change this file while locked=true without unlock_ack.
 */
export const PADDLE_PRICES = {
  grow_hub_launch: "pri_01kxtn6asavavmqv54407h464b",
  grow_hub_growth: "pri_01kxtn6b41wzt07rnzvyte4sn8",
  grow_hub_scale: "pri_01kxtn6befjw8m8gz9a5vwf0wf",
} as const;

export type PaddlePlanKey = keyof typeof PADDLE_PRICES;
export function isPaddlePlanKey(value: string): value is PaddlePlanKey {
  return Object.prototype.hasOwnProperty.call(PADDLE_PRICES, value);
}
export function paddlePlanUrl(plan: PaddlePlanKey, opts: { source?: string; lang?: "fr" | "en"; content?: string } = {}) {
  const url = new URL(opts.lang === "en" ? "/en/payer" : "/payer", "https://blackwayconnect.com");
  url.searchParams.set("plan", plan);
  if (opts.source) url.searchParams.set("utm_source", opts.source);
  if (opts.content) url.searchParams.set("utm_content", opts.content);
  return url.toString();
}
