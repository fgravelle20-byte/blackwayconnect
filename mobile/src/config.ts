/** Live product URLs — Portail Client Master + outils (blackwayconnect.com). */

export const SITE = "https://blackwayconnect.com";

export const TRACK = {
  bw_source: "mobile_app",
  bw_ref: "capacitor_app",
  utm_source: "grow_hub_app",
  utm_medium: "app",
} as const;

export function withTrack(
  pathOrUrl: string,
  extra: Record<string, string> = {},
): string {
  const url = pathOrUrl.startsWith("http")
    ? new URL(pathOrUrl)
    : new URL(pathOrUrl, SITE);
  const params = { ...TRACK, ...extra };
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return url.toString();
}

export const URLS = {
  portal: withTrack("/portail", { utm_campaign: "home_portal" }),
  tools: withTrack("/outils", { utm_campaign: "tools" }),
  diagnostic: withTrack("/diagnostic"),
  compare: withTrack("/comparer"),
  relance: withTrack("/outils/relance-panier"),
  soumission: withTrack("/outils/soumission"),
  checklist: withTrack("/outils/checklist"),
  roi: withTrack("/outils#roi"),
  growHub: withTrack("/grow-hub"),
  /** Stripe Grow Hub — MUST open in external Safari / Chrome (Apple IAP). */
  forfaits: withTrack("/forfaits", {
    utm_medium: "app_store",
    utm_campaign: "external_checkout",
  }),
  contact: withTrack("/contact"),
  privacy: withTrack("/confidentialite"),
  home: withTrack("/", { utm_campaign: "home" }),
  bootstrap: `${SITE}/api/mobile/bootstrap`,
} as const;

export const SUPPORT = {
  email: "serviceclient@blackwayconnect.com",
  phoneLocal: "+14502316911",
  phoneTollFree: "+18888539080",
  telLocal: "tel:+14502316911",
  telTollFree: "tel:+18888539080",
  mailto: "mailto:serviceclient@blackwayconnect.com",
} as const;

export const TOOLS = [
  { id: "diagnostic", labelFr: "Diagnostic / Leak Score", labelEn: "Diagnostic / Leak Score", url: URLS.diagnostic },
  { id: "outils", labelFr: "Master Tools", labelEn: "Master Tools", url: URLS.tools },
  { id: "comparer", labelFr: "Comparateur", labelEn: "Comparator", url: URLS.compare },
  { id: "relance", labelFr: "Relance panier", labelEn: "Cart recovery", url: URLS.relance },
  { id: "soumission", labelFr: "Soumission", labelEn: "Submission", url: URLS.soumission },
  { id: "checklist", labelFr: "Checklist 7 jours", labelEn: "7-day checklist", url: URLS.checklist },
  { id: "roi", labelFr: "Calculateur ROI", labelEn: "ROI calculator", url: URLS.roi },
  { id: "grow", labelFr: "Grow Hub Preview", labelEn: "Grow Hub Preview", url: URLS.growHub },
] as const;

export type TabId = "home" | "portail" | "outils" | "contact";
