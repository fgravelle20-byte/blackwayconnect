import { isPaddlePlanKey, paddlePlanUrl } from "./paddleCatalog";

/**
 * BlackWay Grow Hub catalog — checkout is Paddle only.
 * Spark / Launch / Growth / Scale / Command / Partner → /payer.
 * Legacy Stripe price / plink IDs stay for inbound webhook forfait mapping only.
 * See ops/payment-lock/.
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

/** Self-serve monthly ladder (CAD). Every plan is sold through Paddle /payer. */
export const PLANS: Record<PlanKey, PlanCatalog> = {
  grow_hub_spark: {
    key: "grow_hub_spark",
    forfait: "grow_hub_spark",
    priceId: "price_1U1FKzAG7HUL9RtrC2bJrFVP",
    productId: "prod_V1HuBVHegAkaHb",
    paymentLinkId: "plink_1UCmB6AG7HUL9RtrpvUpROqh",
    paymentLink: paddlePlanUrl("grow_hub_spark"),
    amountCad: 99,
  },
  grow_hub_launch: {
    key: "grow_hub_launch",
    forfait: "grow_hub_launch",
    priceId: "price_1U1FLbAG7HUL9Rtr3QF6c4pC",
    productId: "prod_V1HvK45vGGJ68K",
    paymentLinkId: "plink_1UCmBxAG7HUL9RtrUdOVuMNm",
    paymentLink: paddlePlanUrl("grow_hub_launch"),
    amountCad: 149,
  },
  grow_hub_growth: {
    key: "grow_hub_growth",
    forfait: "grow_hub_growth",
    priceId: "price_1U1FLcAG7HUL9RtrgSob9cmw",
    productId: "prod_V1Hv0CUSd3Gal9",
    paymentLinkId: "plink_1UCmBzAG7HUL9RtrG7wA53Aq",
    paymentLink: paddlePlanUrl("grow_hub_growth"),
    amountCad: 349,
    featured: true,
  },
  grow_hub_scale: {
    key: "grow_hub_scale",
    forfait: "grow_hub_scale",
    priceId: "price_1U1FLdAG7HUL9RtrWL5IQyME",
    productId: "prod_V1HvMstGzO6z9Z",
    paymentLinkId: "plink_1UCmC0AG7HUL9RtrSOaDDzbo",
    paymentLink: paddlePlanUrl("grow_hub_scale"),
    amountCad: 699,
  },
  grow_hub_command: {
    key: "grow_hub_command",
    forfait: "grow_hub_command",
    priceId: "price_1U1FLeAG7HUL9Rtrc8R6DEdZ",
    productId: "prod_V1Hv4OhF6vomby",
    paymentLinkId: "plink_1UCmBJAG7HUL9RtrnvIfFOMn",
    paymentLink: paddlePlanUrl("grow_hub_command"),
    amountCad: 1249,
  },
  grow_hub_partner: {
    key: "grow_hub_partner",
    forfait: "grow_hub_partner",
    priceId: "price_1U1FLfAG7HUL9RtruTYWaERD",
    productId: "prod_V1HvFolyqB03rO",
    paymentLinkId: "plink_1UCmBKAG7HUL9RtrFzh2ZDB1",
    paymentLink: paddlePlanUrl("grow_hub_partner"),
    amountCad: 2499,
  },
};

export const PLAN_ORDER: PlanKey[] = [
  "grow_hub_launch",
  "grow_hub_growth",
  "grow_hub_scale",
];

export const FEATURED_PLAN: PlanKey = "grow_hub_growth";

/** The web and mobile bootstrap use the same BlackWay Paddle checkout route. */
export const CHECKOUT_LINKS = {
  grow_hub_spark: PLANS.grow_hub_spark.paymentLink,
  grow_hub_launch: PLANS.grow_hub_launch.paymentLink,
  grow_hub_growth: PLANS.grow_hub_growth.paymentLink,
  grow_hub_scale: PLANS.grow_hub_scale.paymentLink,
  grow_hub_command: PLANS.grow_hub_command.paymentLink,
  grow_hub_partner: PLANS.grow_hub_partner.paymentLink,
  currency: "cad" as const,
  processor: "paddle" as const,
  storefront: "https://blackwayconnect.com/forfaits",
};

/**
 * Legacy Stripe lien de paiement IDs — inbound webhook forfait resolution only.
 */
export const LEGACY_PAYMENT_LINK_IDS: Record<string, PlanKey> = {
  plink_1U1FMTAG7HUL9RtrDCjxRIl6: "grow_hub_spark",
  plink_1U1FMUAG7HUL9RtrqsOarwY3: "grow_hub_launch",
  plink_1U1FMTAG7HUL9RtrDvKqcL9e: "grow_hub_growth",
  plink_1U1FMzAG7HUL9RtrIPzQYi9n: "grow_hub_scale",
  plink_1U1FMTAG7HUL9RtrODdZgiSo: "grow_hub_command",
  plink_1U1FMYAG7HUL9RtruMZLdQo2: "grow_hub_partner",
};

/** Legacy Stripe plink IDs → Grow Hub forfait (pipe webhook fallback). */
export function paymentLinkToForfait(): Record<string, PlanKey> {
  const map: Record<string, PlanKey> = { ...LEGACY_PAYMENT_LINK_IDS };
  for (const plan of Object.values(PLANS)) {
    map[plan.paymentLinkId] = plan.key;
  }
  return map;
}

export const STRIPE_WEBHOOK = "https://api.blackwayconnect.com/webhooks/stripe";
export const PORTAL_URL = "https://blackwayconnect.com/portail";
export const PORTAL_SUCCESS_URL = "https://blackwayconnect.com/portail";
export const THANK_YOU_URL = PORTAL_SUCCESS_URL;
export const MERCI_URL = "https://blackwayconnect.com/merci?src=paddle";

export function checkoutUrl(
  plan: PlanKey,
  opts: { source?: string; lang?: "fr" | "en"; content?: string } = {},
) {
  if (isPaddlePlanKey(plan)) return paddlePlanUrl(plan, opts);
  const url = new URL(opts.lang === "en" ? "/en/contact" : "/contact", "https://blackwayconnect.com");
  url.searchParams.set("forfait", plan);
  url.searchParams.set("bw_source", opts.source || "site_web");
  if (opts.content) url.searchParams.set("utm_content", opts.content);
  return url.toString();
}

export function isCheckoutReady(plan: PlanKey): boolean {
  return isPaddlePlanKey(plan);
}
