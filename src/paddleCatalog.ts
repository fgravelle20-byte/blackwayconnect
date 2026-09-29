/** Existing Paddle Live prices for BlackWayConnect.
 * Prices are in CAD per month. Grow Hub + Pack Cellulaire have a 14-day trial; modules IA
 * (chatbot, accueil vocal) bill from day one. Never treat a client-side success
 * redirect as proof of payment; fulfillment must come from a verified webhook.
 *
 * PAYMENT-LOCKED — do not edit. See ops/payment-lock/LOCKED.json + README.md.
 * CI fails PRs that change this file while locked=true without unlock_ack.
 */
export const PADDLE_PRICES = {
  grow_hub_spark: "pri_01m3nt7rm1cc19134bb3e86fpb",
  grow_hub_launch: "pri_01kxtn6asavavmqv54407h464b",
  grow_hub_growth: "pri_01kxtn6b41wzt07rnzvyte4sn8",
  grow_hub_scale: "pri_01kxtn6befjw8m8gz9a5vwf0wf",
  grow_hub_command: "pri_01m3nt7rs3vajzyv8k8r57qswc",
  grow_hub_partner: "pri_01m3nt7rxx08w09zef4xf2rage",
  cell_signal: "pri_01m3nt7s39b94k4p7a13m3sya2",
  cell_route: "pri_01m3nt7s88bxrx8k6jph2gmtt2",
  cell_fleet: "pri_01m3nt7sd8mkr915y6vtgs6m3p",
  cell_command: "pri_01m3nt7sj4wndn0qkd9d855zpr",
  ia_chatbot_1: "pri_01m3nt7sqgkcqb2payzrn0f8cf",
  ia_chatbot_5: "pri_01m3nt7ss5526fp4j6q98zdqc0",
  ia_chatbot_illimite: "pri_01m3nt7stvq4ff1942nybarhxn",
  ia_vocal_basic: "pri_01m3nt7szxc265whjs40e2y5pd",
  ia_vocal_avance: "pri_01m3nt7t1k43gy04eyf71amkd5",
  ia_vocal_premium: "pri_01m3nt7t39xq8pbggfeh6ejax4",
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
