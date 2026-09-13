/**
 * Vorixa service géré on live merchant acct_1TDZjzAG7HUL9Rtr.
 *
 * Official CAD amounts (499 / 999 / 1500 / 3000) overlap Grow Hub Growth ($499).
 * Pipe must never resolve these invoices / Payment Links as grow_hub_*.
 * Vorixa activation stays on vorixa.base44.app — this file is a guard only.
 *
 * 2026-09-13: the Aug 31 plan links (`plink_1U9E6m` / `1U9E7F` / `1U9E7H` /
 * `1U9E7J`) cannot be reactivated (no valid payment methods on those objects).
 * Replacement links use Stripe Managed Payments and are the live checkout URLs.
 */

export const VORIXA_BASE44_APP_ID = "6a2a047fbc1c05e8396f0ad2";

export const VORIXA_GERE_PLANS = {
  vorixa_gere_depart: {
    key: "vorixa_gere_depart",
    label: "Vorixa service géré — Départ",
    amountCad: 499,
    priceId: "price_1U9DxTAG7HUL9RtrioEG5ZM5",
    paymentLinkId: "plink_1UFMWMAG7HUL9RtrW8L1FIE0",
    paymentLink: "https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t",
    legacyPaymentLinkIds: ["plink_1U9E6mAG7HUL9RtrmS3M1qh3"],
  },
  vorixa_gere_croissance: {
    key: "vorixa_gere_croissance",
    label: "Vorixa service géré — Croissance",
    amountCad: 999,
    priceId: "price_1U9DxYAG7HUL9RtrlCdkCnNH",
    paymentLinkId: "plink_1UFMWaAG7HUL9RtrtBPA3MHL",
    paymentLink: "https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u",
    legacyPaymentLinkIds: ["plink_1U9E7FAG7HUL9RtrV9HPIqvz"],
  },
  vorixa_gere_1500: {
    key: "vorixa_gere_1500",
    label: "Vorixa service géré — Personnalisé 1500",
    amountCad: 1500,
    priceId: "price_1U9DxbAG7HUL9RtrpUFQKphC",
    paymentLinkId: "plink_1UFMWaAG7HUL9RtrC5Q9YE4T",
    paymentLink: "https://buy.stripe.com/9B63cudml1kLbwa18WeIw2v",
    legacyPaymentLinkIds: ["plink_1U9E7HAG7HUL9Rtr4VJoLqaJ"],
  },
  vorixa_gere_3000: {
    key: "vorixa_gere_3000",
    label: "Vorixa service géré — Personnalisé 3000",
    amountCad: 3000,
    priceId: "price_1U9DxeAG7HUL9RtrZtujFl10",
    paymentLinkId: "plink_1UFMWbAG7HUL9RtrXevysZSA",
    paymentLink: "https://buy.stripe.com/bJebJ05TT7J90Rw5pceIw2w",
    legacyPaymentLinkIds: ["plink_1U9E7JAG7HUL9RtrAv9D6gpE"],
  },
};

export const VORIXA_GERE_PRICE_IDS = new Set(
  Object.values(VORIXA_GERE_PLANS).map((p) => p.priceId),
);

export const VORIXA_GERE_PLINK_IDS = new Set(
  Object.values(VORIXA_GERE_PLANS).flatMap((p) => [
    p.paymentLinkId,
    ...(p.legacyPaymentLinkIds || []),
  ]),
);

const VORIXA_META_KEYS = [
  "vorixa_repair_batch",
  "vorixa_source",
  "vorixa_plan_amount_cad",
  "vorixa_payment_link_id",
  "vorixa_ref_price",
  "vorixa_payment_url",
];

function priceIdsFromStripeObject(s) {
  const ids = [];
  const push = (id) => {
    if (typeof id === "string" && id.startsWith("price_")) ids.push(id);
  };
  push(s.default_price);
  const items = s.items?.data || [];
  for (const item of items) {
    push(item.price?.id || item.plan?.id || item.price);
  }
  const lines = s.lines?.data || s.display_items || [];
  for (const line of lines) {
    push(line.price?.id || line.pricing?.price_details?.price || line.price);
    push(line.metadata?.vorixa_ref_price);
  }
  push(s.metadata?.vorixa_ref_price);
  return ids;
}

function plinkFromStripeObject(s) {
  const raw = s.payment_link;
  if (!raw) return s.metadata?.vorixa_payment_link_id || null;
  return typeof raw === "string" ? raw : raw.id;
}

function textBlob(s) {
  const parts = [s.description, s.statement_descriptor];
  const lines = s.lines?.data || [];
  for (const line of lines) parts.push(line.description);
  return parts.filter(Boolean).join(" ");
}

/** Live checkout URL, tagged with the Stripe customer id when provided. */
export function vorixaGereCheckoutUrl(planKey, customerId) {
  const plan = VORIXA_GERE_PLANS[planKey];
  if (!plan?.paymentLink) return "";
  const url = new URL(plan.paymentLink);
  if (customerId) url.searchParams.set("client_reference_id", String(customerId));
  return url.toString();
}

/** True when this Stripe object is a Vorixa (not Grow Hub) charge. */
export function isVorixaManagedStripeObject(s) {
  if (!s || typeof s !== "object") return false;
  const meta = s.metadata || {};
  for (const key of VORIXA_META_KEYS) {
    if (meta[key]) return true;
  }
  if (String(meta.marque || "").toUpperCase() === "VORIXA") return true;
  if (meta.gamme === "service_gere") return true;
  if (meta.base44_app_id === VORIXA_BASE44_APP_ID) return true;
  const plink = plinkFromStripeObject(s);
  if (plink && VORIXA_GERE_PLINK_IDS.has(plink)) return true;
  for (const priceId of priceIdsFromStripeObject(s)) {
    if (VORIXA_GERE_PRICE_IDS.has(priceId)) return true;
  }
  if (/\bvorixa\b/i.test(textBlob(s))) return true;
  return false;
}
