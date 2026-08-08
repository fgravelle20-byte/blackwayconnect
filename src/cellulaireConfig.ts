/**
 * TYPE B — Forfaits CELLULAIRES (revenu #2 · outils terrain).
 * Distinct from Grow Hub web (Type A). Same Portail / HubSpot can hold both.
 * Stripe Payment Links: empty until created in Dashboard — see STRIPE_CELLULAIRE_TODO.
 */

export type CellulairePlanKey =
  | "cell_signal"
  | "cell_route"
  | "cell_fleet"
  | "cell_command";

export type CellulaireToolId =
  | "cell_capture"
  | "cell_pipeline"
  | "cell_checkout"
  | "cell_streak"
  | "cell_fleet_ops"
  | "cell_merge"
  | "forfaits_cellulaire"
  | "support";

export type CellulairePlan = {
  key: CellulairePlanKey;
  forfait: CellulairePlanKey;
  nameFr: string;
  nameEn: string;
  amountCad: number;
  /** Empty until Stripe Payment Link created — checkout falls back to contact. */
  paymentLink: string;
  priceId: string;
  productId: string;
  featured?: boolean;
  tools: CellulaireToolId[];
  blurbFr: string;
  blurbEn: string;
};

export const CELLULAIRE_PLANS: Record<CellulairePlanKey, CellulairePlan> = {
  cell_signal: {
    key: "cell_signal",
    forfait: "cell_signal",
    nameFr: "Cell Signal",
    nameEn: "Cell Signal",
    amountCad: 79,
    paymentLink: "",
    priceId: "",
    productId: "",
    tools: ["cell_capture", "forfaits_cellulaire", "support"],
    blurbFr: "Capture lead terrain — fiche rapide, sync HubSpot.",
    blurbEn: "Field lead capture — quick card, HubSpot sync.",
  },
  cell_route: {
    key: "cell_route",
    forfait: "cell_route",
    nameFr: "Cell Route",
    nameEn: "Cell Route",
    amountCad: 199,
    paymentLink: "",
    priceId: "",
    productId: "",
    tools: ["cell_capture", "cell_pipeline", "cell_checkout", "forfaits_cellulaire", "support"],
    blurbFr: "Leads + checkout prospect en déplacement.",
    blurbEn: "Leads + prospect checkout on the road.",
  },
  cell_fleet: {
    key: "cell_fleet",
    forfait: "cell_fleet",
    nameFr: "Cell Fleet",
    nameEn: "Cell Fleet",
    amountCad: 399,
    paymentLink: "",
    priceId: "",
    productId: "",
    featured: true,
    tools: [
      "cell_capture",
      "cell_pipeline",
      "cell_checkout",
      "cell_streak",
      "cell_fleet_ops",
      "forfaits_cellulaire",
      "support",
    ],
    blurbFr: "Équipe terrain multi-user + streak quotidien.",
    blurbEn: "Multi-user field team + daily streak.",
  },
  cell_command: {
    key: "cell_command",
    forfait: "cell_command",
    nameFr: "Cell Command",
    nameEn: "Cell Command",
    amountCad: 799,
    paymentLink: "",
    priceId: "",
    productId: "",
    tools: [
      "cell_capture",
      "cell_pipeline",
      "cell_checkout",
      "cell_streak",
      "cell_fleet_ops",
      "cell_merge",
      "forfaits_cellulaire",
      "support",
    ],
    blurbFr: "Ops terrain complets — merge Grow Hub web + Portail.",
    blurbEn: "Full field ops — merge Grow Hub web + Portal.",
  },
};

export const CELLULAIRE_ORDER: CellulairePlanKey[] = [
  "cell_signal",
  "cell_route",
  "cell_fleet",
  "cell_command",
];

export const FEATURED_CELLULAIRE: CellulairePlanKey = "cell_fleet";

export const CELLULAIRE_RANK: Record<string, number> = {
  cell_signal: 1,
  cell_route: 2,
  cell_fleet: 3,
  cell_command: 4,
};

/** Stripe Dashboard — create these Payment Links (CAD monthly), success → /portail?session_id={CHECKOUT_SESSION_ID} */
export const STRIPE_CELLULAIRE_TODO = [
  { key: "cell_signal", name: "Cell Signal", amountCad: 79, metadata: "bw_forfait=cell_signal" },
  { key: "cell_route", name: "Cell Route", amountCad: 199, metadata: "bw_forfait=cell_route" },
  { key: "cell_fleet", name: "Cell Fleet", amountCad: 399, metadata: "bw_forfait=cell_fleet" },
  { key: "cell_command", name: "Cell Command", amountCad: 799, metadata: "bw_forfait=cell_command" },
] as const;

export function isCellulaireForfait(key: string | null | undefined): boolean {
  return !!key && String(key).startsWith("cell_");
}

export function cellulaireRank(forfait: string | null | undefined): number {
  if (!forfait) return 0;
  return CELLULAIRE_RANK[forfait] || 0;
}

export function cellulaireCheckoutUrl(
  plan: CellulairePlanKey,
  opts: { source?: string; lang?: "fr" | "en"; content?: string } = {},
): string {
  const link = CELLULAIRE_PLANS[plan].paymentLink;
  if (!link) {
    const path = opts.lang === "en" ? "/en/contact" : "/contact";
    return `https://blackwayconnect.com${path}?forfait=${plan}&bw_source=cellulaire`;
  }
  const url = new URL(link);
  const source = opts.source || "cellulaire";
  url.searchParams.set("client_reference_id", `${source}:${plan}`);
  url.searchParams.set("utm_source", "blackwayconnect_cellulaire");
  url.searchParams.set("utm_medium", "checkout");
  url.searchParams.set("utm_campaign", plan);
  if (opts.content) url.searchParams.set("utm_content", opts.content);
  if (opts.lang) url.searchParams.set("locale", opts.lang === "fr" ? "fr-CA" : "en-CA");
  return url.toString();
}

export function isCellulaireCheckoutReady(plan: CellulairePlanKey): boolean {
  return !!CELLULAIRE_PLANS[plan].paymentLink;
}
