import { paddlePlanUrl } from "./paddleCatalog";

/**
 * Stripe Grow Hub catalog — live Payment Links on merchant acct_1TDZjzAG7HUL9Rtr.
 *
 * Public URLs here are the single source of truth for site CTAs, `/api/config`,
 * and mobile bootstrap. Do not hardcode a parallel buy.stripe.com list in the worker.
 *
 * `plink_1UDT7lAG7HUL9Rtr6j7UWahF` is NOT a valid live Payment Link on this
 * account (Stripe `resource_missing`). Do not wire it. Create replacements in
 * **Live** mode on this same account (not Test, not a Connect platform account),
 * then paste both the `plink_…` id and the `https://buy.stripe.com/…` URL here.
 *
 * 2026-09-13: the six `plink_1UCmB*` URLs were briefly `active: false` on
 * this account (Stripe listed them deactivated). They were reactivated the
 * same day. Vorixa service-géré checkout is a separate catalog —
 * see `pipe/vorixaManaged.js`.
 */

export type PlanKey =
  | "grow_hub_spark"
  | "grow_hub_launch"
  | "grow_hub_growth"
  | "grow_hub_scale"
  | "grow_hub_command"
  | "grow_hub_partner";

export type PlanCatalog = {
  key: PlanKey;
  forfait: PlanKey;
  priceId: string;
  productId: string;
  paymentLinkId: string;
  paymentLink: string;
  amountCad: number;
  featured?: boolean;
};

/** Self-serve monthly ladder (CAD). Enterprise = contact only. */
export const PLANS: Record<PlanKey, PlanCatalog> = {
  grow_hub_spark: {
    key: "grow_hub_spark",
    forfait: "grow_hub_spark",
    priceId: "price_1U1FKzAG7HUL9RtrC2bJrFVP",
    productId: "prod_V1HuBVHegAkaHb",
    /** Old Payment Link was deactivated by Stripe — replaced 2026-09-06 with a fresh, active one. */
    paymentLinkId: "plink_1UCmB6AG7HUL9RtrpvUpROqh",
    paymentLink: "https://buy.stripe.com/28EeVc0zz9Rhas604SeIw1U",
    amountCad: 99,
  },
  grow_hub_launch: {
    key: "grow_hub_launch",
    forfait: "grow_hub_launch",
    priceId: "price_1U1FLbAG7HUL9Rtr3QF6c4pC",
    productId: "prod_V1HvK45vGGJ68K",
    paymentLinkId: "plink_1UCmBxAG7HUL9RtrUdOVuMNm",
    paymentLink: "https://buy.stripe.com/3cI3cueqp0gH57McREeIw1X",
    amountCad: 249,
  },
  grow_hub_growth: {
    key: "grow_hub_growth",
    forfait: "grow_hub_growth",
    priceId: "price_1U1FLcAG7HUL9RtrgSob9cmw",
    productId: "prod_V1Hv0CUSd3Gal9",
    paymentLinkId: "plink_1UCmBzAG7HUL9RtrG7wA53Aq",
    paymentLink: "https://buy.stripe.com/aFa5kC6XX8Nd43IdVIeIw1Y",
    amountCad: 499,
    featured: true,
  },
  grow_hub_scale: {
    key: "grow_hub_scale",
    forfait: "grow_hub_scale",
    priceId: "price_1U1FLdAG7HUL9RtrWL5IQyME",
    productId: "prod_V1HvMstGzO6z9Z",
    paymentLinkId: "plink_1UCmC0AG7HUL9RtrSOaDDzbo",
    paymentLink: "https://buy.stripe.com/9B600i1DD8Ndbwa6tgeIw1Z",
    amountCad: 749,
  },
  grow_hub_command: {
    key: "grow_hub_command",
    forfait: "grow_hub_command",
    priceId: "price_1U1FLeAG7HUL9Rtrc8R6DEdZ",
    productId: "prod_V1Hv4OhF6vomby",
    paymentLinkId: "plink_1UCmBJAG7HUL9RtrnvIfFOMn",
    paymentLink: "https://buy.stripe.com/14A6oGfut0gHgQubNAeIw1V",
    amountCad: 1249,
  },
  grow_hub_partner: {
    key: "grow_hub_partner",
    forfait: "grow_hub_partner",
    priceId: "price_1U1FLfAG7HUL9RtruTYWaERD",
    productId: "prod_V1HvFolyqB03rO",
    paymentLinkId: "plink_1UCmBKAG7HUL9RtrFzh2ZDB1",
    paymentLink: "https://buy.stripe.com/eVq7sK9658Nd43IeZMeIw1W",
    amountCad: 2499,
  },
};

export const PLAN_ORDER: PlanKey[] = [
  "grow_hub_spark",
  "grow_hub_launch",
  "grow_hub_growth",
  "grow_hub_scale",
  "grow_hub_command",
  "grow_hub_partner",
];

export const FEATURED_PLAN: PlanKey = "grow_hub_growth";

/** The web and mobile bootstrap use the same BlackWay checkout route. */
export const CHECKOUT_LINKS = {
  grow_hub_spark: paddlePlanUrl("grow_hub_spark"),
  grow_hub_launch: paddlePlanUrl("grow_hub_launch"),
  grow_hub_growth: paddlePlanUrl("grow_hub_growth"),
  grow_hub_scale: paddlePlanUrl("grow_hub_scale"),
  grow_hub_command: paddlePlanUrl("grow_hub_command"),
  grow_hub_partner: paddlePlanUrl("grow_hub_partner"),
  currency: "cad" as const,
  processor: "paddle" as const,
  storefront: "https://blackwayconnect.com/forfaits",
};

/**
 * Previous Payment Link IDs (public URLs deactivated 2026-09-06).
 * Keep for webhook forfait resolution on older Checkout Sessions.
 */
export const LEGACY_PAYMENT_LINK_IDS: Record<string, PlanKey> = {
  plink_1U1FMTAG7HUL9RtrDCjxRIl6: "grow_hub_spark",
  plink_1U1FMUAG7HUL9RtrqsOarwY3: "grow_hub_launch",
  plink_1U1FMTAG7HUL9RtrDvKqcL9e: "grow_hub_growth",
  plink_1U1FMzAG7HUL9RtrIPzQYi9n: "grow_hub_scale",
  plink_1U1FMTAG7HUL9RtrODdZgiSo: "grow_hub_command",
  plink_1U1FMYAG7HUL9RtruMZLdQo2: "grow_hub_partner",
};

/** Live + legacy Payment Link IDs → Grow Hub forfait (pipe webhook fallback). */
export function paymentLinkToForfait(): Record<string, PlanKey> {
  const map: Record<string, PlanKey> = { ...LEGACY_PAYMENT_LINK_IDS };
  for (const plan of Object.values(PLANS)) {
    map[plan.paymentLinkId] = plan.key;
  }
  return map;
}

export const STRIPE_WEBHOOK = "https://api.blackwayconnect.com/webhooks/stripe";
/** Primary post-checkout destination — Client Master Portal (session_id when Payment Link supports it). */
export const PORTAL_URL = "https://blackwayconnect.com/portail";
export const PORTAL_SUCCESS_URL =
  "https://blackwayconnect.com/portail?session_id={CHECKOUT_SESSION_ID}";
export const THANK_YOU_URL = PORTAL_SUCCESS_URL;
/** Secondary activation checklist (kept for deep links / email). */
export const MERCI_URL = "https://blackwayconnect.com/merci?src=stripe";

export function checkoutUrl(
  plan: PlanKey,
  opts: { source?: string; lang?: "fr" | "en"; content?: string } = {},
) {
  return paddlePlanUrl(plan, opts);
}

export function isCheckoutReady(_plan: PlanKey): boolean {
  return true;
}
