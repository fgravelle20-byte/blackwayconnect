/** Portail Master — outils Type A (web) + Type B (cellulaire). Unlock = union des deux plans. */

import {
  CELLULAIRE_PLANS,
  cellulaireRank,
  isCellulaireForfait,
  type CellulairePlanKey,
  type CellulaireToolId,
} from "./cellulaireConfig";

export type WebToolId =
  | "diagnostic"
  | "outils"
  | "relance_panier"
  | "soumission"
  | "checklist"
  | "roi"
  | "comparer"
  | "grow_hub"
  | "secretaire"
  | "forfaits"
  | "support";

export type PortalToolId = WebToolId | CellulaireToolId | "upsell_web" | "upsell_cellulaire";

export type PortalTool = {
  id: PortalToolId;
  path?: string;
  external?: boolean;
  /** Grow Hub web rank (PLAN_RANK). 0 = N/A for this line. */
  minWebPlan: number;
  /** Cellulaire rank. 0 = N/A for this line. */
  minCellPlan: number;
  line: "web" | "cellulaire";
};

export const PLAN_RANK: Record<string, number> = {
  grow_hub_spark: 1,
  grow_hub_launch: 2,
  grow_hub_growth: 3,
  grow_hub_scale: 4,
  grow_hub_command: 5,
  grow_hub_partner: 6,
  enterprise: 7,
};

/** @deprecated use WEB_PORTAL_TOOLS — kept for imports */
export const PORTAL_TOOLS: PortalTool[] = [];

export const WEB_PORTAL_TOOLS: PortalTool[] = [
  { id: "diagnostic", path: "/diagnostic", minWebPlan: 1, minCellPlan: 0, line: "web" },
  { id: "outils", path: "/outils", minWebPlan: 1, minCellPlan: 0, line: "web" },
  { id: "relance_panier", path: "/outils/relance-panier", minWebPlan: 2, minCellPlan: 0, line: "web" },
  { id: "soumission", path: "/outils/soumission", minWebPlan: 2, minCellPlan: 0, line: "web" },
  { id: "checklist", path: "/outils/checklist", minWebPlan: 1, minCellPlan: 0, line: "web" },
  { id: "roi", path: "/outils#roi", minWebPlan: 2, minCellPlan: 0, line: "web" },
  { id: "comparer", path: "/outils#comparateur", minWebPlan: 2, minCellPlan: 0, line: "web" },
  { id: "grow_hub", path: "/grow-hub", minWebPlan: 2, minCellPlan: 0, line: "web" },
  { id: "secretaire", path: "/", minWebPlan: 1, minCellPlan: 0, line: "web" },
  { id: "forfaits", path: "/forfaits", minWebPlan: 1, minCellPlan: 0, line: "web" },
  { id: "support", path: "/contact", minWebPlan: 1, minCellPlan: 0, line: "web" },
];

export const CELL_PORTAL_TOOLS: PortalTool[] = [
  { id: "cell_capture", path: "/forfaits-cellulaire#outils", minWebPlan: 0, minCellPlan: 1, line: "cellulaire" },
  { id: "cell_pipeline", path: "/forfaits-cellulaire#outils", minWebPlan: 0, minCellPlan: 2, line: "cellulaire" },
  { id: "cell_checkout", path: "/forfaits-cellulaire#outils", minWebPlan: 0, minCellPlan: 2, line: "cellulaire" },
  { id: "cell_streak", path: "/forfaits-cellulaire#outils", minWebPlan: 0, minCellPlan: 3, line: "cellulaire" },
  { id: "cell_fleet_ops", path: "/forfaits-cellulaire#outils", minWebPlan: 0, minCellPlan: 3, line: "cellulaire" },
  { id: "cell_merge", path: "/portail", minWebPlan: 0, minCellPlan: 4, line: "cellulaire" },
  { id: "forfaits_cellulaire", path: "/forfaits-cellulaire", minWebPlan: 0, minCellPlan: 1, line: "cellulaire" },
  { id: "support", path: "/contact", minWebPlan: 0, minCellPlan: 1, line: "cellulaire" },
];

export function planRank(forfait: string | null | undefined): number {
  if (!forfait) return 0;
  if (isCellulaireForfait(forfait)) return 0;
  return PLAN_RANK[forfait] || 0;
}

export function splitForfaits(forfait: string | null | undefined, forfaitCellulaire?: string | null) {
  const a = String(forfait || "").trim();
  const b = String(forfaitCellulaire || "").trim();
  const web = !isCellulaireForfait(a) && a ? a : "";
  const cell =
    (isCellulaireForfait(b) && b) || (isCellulaireForfait(a) && a) || "";
  return { forfaitWeb: web || null, forfaitCellulaire: cell || null };
}

export function toolUnlocked(
  forfaitWeb: string | null | undefined,
  forfaitCellulaire: string | null | undefined,
  tool: PortalTool,
): boolean {
  const w = planRank(forfaitWeb);
  const c = cellulaireRank(forfaitCellulaire);
  if (tool.line === "web") return tool.minWebPlan > 0 && w >= tool.minWebPlan;
  return tool.minCellPlan > 0 && c >= tool.minCellPlan;
}

/** Tools listed on a cellulaire plan (for marketing page). */
export function toolsForCellPlan(key: CellulairePlanKey): CellulaireToolId[] {
  return CELLULAIRE_PLANS[key].tools;
}
