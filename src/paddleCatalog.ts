/** Paddle Live prices for the two published BlackWay subscription lines.
 * Prices are in CAD per month, with no trial. Never treat a client-side success
 * redirect as proof of payment; fulfillment must come from a verified webhook.
 */
export const PADDLE_PRICES = {
  grow_hub_spark: "pri_01m367hc0g9kwm95f8c4cw8qcm",
  grow_hub_launch: "pri_01m367bnv193q0ax1eg5xachfb",
  grow_hub_growth: "pri_01m3676x0deapt2f3twg61w8fj",
  grow_hub_scale: "pri_01m367j628typxndppda8ezjg5",
  grow_hub_command: "pri_01m367jfxnt4gzc5sz4nc0ef6j",
  grow_hub_partner: "pri_01m367jj8k73hwf6va3thycn79",
  cell_signal: "pri_01m367msw8hskwjjmewxa01bpj",
  cell_route: "pri_01m367mw5g91a8a67bamdewymh",
  cell_fleet: "pri_01m367n4vr0svam378g9fzcdj4",
  cell_command: "pri_01m367n73fpv70r6ge1cfsqdp2",
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
