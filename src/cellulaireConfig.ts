/**
 * TYPE B — Forfaits CELLULAIRES (revenu #2 · outils terrain).
 * Distinct from Grow Hub web (Type A). Same portail + Master CRM can hold both.
 * Wix Payments checkout (immediate billing). Stripe checkout is retired.
 */
import { paymentPlanUrl, hasCheckoutUrl } from "./paymentCatalog";

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
  paymentLink: string;
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
    paymentLink: paymentPlanUrl("cell_signal"),
    tools: ["cell_capture", "forfaits_cellulaire", "support"],
    blurbFr: "Capture lead terrain — fiche rapide, sync CRM BlackWay.",
    blurbEn: "Field lead capture — quick card, BlackWay CRM sync.",
  },
  cell_route: {
    key: "cell_route",
    forfait: "cell_route",
    nameFr: "Cell Route",
    nameEn: "Cell Route",
    amountCad: 199,
    paymentLink: paymentPlanUrl("cell_route"),
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
    paymentLink: paymentPlanUrl("cell_fleet"),
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
    paymentLink: paymentPlanUrl("cell_command"),
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
  return paymentPlanUrl(plan, { lang: opts.lang, source: opts.source || "cellulaire", content: opts.content });
}

export function isCellulaireCheckoutReady(plan: CellulairePlanKey): boolean {
  return hasCheckoutUrl(plan);
}